use crate::models::{
    schedule::{Schedule, ScheduleAvailability},
    theme::{Theme, ThemeAvailability},
};
use serde::{Deserialize, Serialize};
use serde::de::DeserializeOwned;

#[derive(Debug, Clone)]
pub struct ApiClient {
    client: reqwest::Client,
    base_url: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct InitUploadRequest {
    pub filename: String,
    pub metadata: UploadMetadata,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UploadMetadata {
    pub client_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub session_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub recording_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub content_type: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub timestamp: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub duration: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub language: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InitUploadResponse {
    pub presigned_url: String,
}

impl ApiClient {
    pub fn new(base_url: String) -> Self {
        // Remap localhost to 10.0.2.2 for Android emulator
        let base_url = Self::remap_localhost_for_android(base_url);
        
        Self {
            client: reqwest::Client::new(),
            base_url,
        }
    }

    /// Remap localhost URLs to 10.0.2.2 for Android emulator
    /// Android emulators use 10.0.2.2 to refer to the host machine's localhost
    fn remap_localhost_for_android(url: String) -> String {
        #[cfg(target_os = "android")]
        {
            return url
                .replace("http://localhost:", "http://10.0.2.2:")
                .replace("https://localhost:", "https://10.0.2.2:")
                .replace("http://127.0.0.1:", "http://10.0.2.2:")
                .replace("https://127.0.0.1:", "https://10.0.2.2:");
        }
        
        #[cfg(not(target_os = "android"))]
        {
            url
        }
    }

    /// Get the base URL for the API
    pub fn base_url(&self) -> &str {
        &self.base_url
    }

    async fn parse_json_response<T: DeserializeOwned>(
        response: reqwest::Response,
    ) -> Result<T, String> {
        let status = response.status();
        let response_text = response
            .text()
            .await
            .map_err(|e| format!("Failed to read response body: {}", e))?;

        if !status.is_success() {
            return Err(format!(
                "Request failed with status {}: {}",
                status,
                response_text
            ));
        }

        serde_json::from_str::<T>(&response_text)
            .map_err(|e| format!("Failed to parse response: {}. Response was: {}", e, response_text))
    }

    /// Fetch all themes from the backend
    pub async fn get_themes(&self) -> Result<Vec<ThemeAvailability>, String> {
        let url = format!("{}/v1/theme", self.base_url);
        
        let response = self.client
            .get(&url)
            .send()
            .await
            .map_err(|e| format!("Failed to send request: {}", e))?;

        Self::parse_json_response(response).await
    }

    /// Fetch a specific theme by ID
    pub async fn get_theme(&self, theme_id: &str, lang: &str) -> Result<Theme, String> {
        let url = format!("{}/v1/theme/{}", self.base_url, theme_id);
        
        let response = self.client
            .get(&url)
            .query(&[("lang", lang)])
            .send()
            .await
            .map_err(|e| format!("Failed to send request: {}", e))?;

        Self::parse_json_response(response).await
    }

    /// Fetch all schedules from the backend
    pub async fn get_schedules(&self) -> Result<Vec<ScheduleAvailability>, String> {
        let url = format!("{}/v1/schedule", self.base_url);

        let response = self.client
            .get(&url)
            .send()
            .await
            .map_err(|e| format!("Failed to send request: {}", e))?;

        Self::parse_json_response::<Vec<ScheduleAvailability>>(response).await
    }

    /// Fetch a specific schedule by ID
    pub async fn get_schedule(&self, schedule_id: &str, lang: &str) -> Result<Schedule, String> {
        let url = format!("{}/v1/schedule/{}", self.base_url, schedule_id);
        
        let response = self.client
            .get(&url)
            .query(&[("lang", lang)])
            .send()
            .await
            .map_err(|e| format!("Failed to send request: {}", e))?;

        let mut schedule = Self::parse_json_response::<Schedule>(response).await?;

        schedule.normalize_for_client();

        Ok(schedule)
    }

    /// Initialize an upload and get a presigned URL for direct upload
    pub async fn init_upload(&self, request: InitUploadRequest) -> Result<InitUploadResponse, String> {
        let url = format!("{}/v1/upload", self.base_url);

        let response = self.client
            .post(&url)
            .json(&request)
            .send()
            .await
            .map_err(|e| format!("Failed to send request: {}", e))?;

        // Check if response is successful
        let status = response.status();
        if !status.is_success() {
            let error_text = response.text().await
                .unwrap_or_else(|_| "Unable to read error response".to_string());
            return Err(format!("Upload init failed with status {}: {}", status, error_text));
        }

        let response_text = response.text().await
            .map_err(|e| format!("Failed to read response body: {}", e))?;

        serde_json::from_str::<InitUploadResponse>(&response_text)
            .map_err(|e| format!("Failed to parse response: {}. Response was: {}", e, response_text))
    }

    /// Upload a file to a presigned URL (e.g., Azure Blob Storage SAS URL)
    pub async fn upload_file(&self, presigned_url: &str, file_data: Vec<u8>) -> Result<(), String> {
        // Fix Docker container hostname for local development
        // The backend returns URLs with "azurite" which won't resolve from the host machine
        let mut upload_url = presigned_url.replace("http://azurite:", "http://localhost:");
        
        // Remap localhost to 10.0.2.2 for Android emulator
        upload_url = Self::remap_localhost_for_android(upload_url);
        
        let response = self.client
            .put(&upload_url)
            .header("x-ms-blob-type", "BlockBlob")
            .body(file_data)
            .send()
            .await
            .map_err(|e| format!("Failed to upload file: {}", e))?;

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_default();
            return Err(format!("File upload failed with status {}: {}", status, error_text));
        }

        Ok(())
    }

    /// Delete recordings by client ID
    pub async fn delete_by_client_id(&self, client_id: &str) -> Result<(), String> {
        let url = format!("{}/v1/recordings/{}", self.base_url, client_id);

        let response = self.client
            .delete(&url)
            .send()
            .await
            .map_err(|e| format!("Failed to send request: {}", e))?;

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_default();
            return Err(format!("Delete by client ID failed with status {}: {}", status, error_text));
        }

        Ok(())
    }

    /// Delete recordings by session ID
    pub async fn delete_by_session_id(&self, client_id: &str, session_id: &str) -> Result<(), String> {
        let url = format!("{}/v1/recordings/{}/{}", self.base_url, client_id, session_id);

        let response = self.client
            .delete(&url)
            .send()
            .await
            .map_err(|e| format!("Failed to send request: {}", e))?;

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_default();
            return Err(format!("Delete by session ID failed with status {}: {}", status, error_text));
        }

        Ok(())
    }

    /// Download media file from the API
    pub async fn download_media(&self, filename: &str) -> Result<Vec<u8>, String> {
        let url = format!("{}/v1/media/{}", self.base_url, filename);
        
        self.client
            .get(&url)
            .send()
            .await
            .map_err(|e| format!("Failed to download media: {}", e))?
            .bytes()
            .await
            .map_err(|e| format!("Failed to read media bytes: {}", e))
            .map(|b| b.to_vec())
    }

    /// Delete a specific recording by recording ID
    pub async fn delete_by_recording_id(
        &self,
        client_id: &str,
        session_id: &str,
        recording_id: &str,
    ) -> Result<(), String> {
        let url = format!(
            "{}/v1/recordings/{}/{}/{}",
            self.base_url, client_id, session_id, recording_id
        );
        
        let response = self.client
            .delete(&url)
            .send()
            .await
            .map_err(|e| format!("Failed to send request: {}", e))?;

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_default();
            return Err(format!("Delete by recording ID failed with status {}: {}", status, error_text));
        }

        Ok(())
    }
}
