use crate::models::{schedule::Schedule, theme::Theme};
use serde::{Deserialize, Serialize};

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
    pub session_id: String,
    pub recording_id: String,
    pub schedule_id: String,
    pub item_id: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InitUploadResponse {
    pub presigned_url: String,
}

impl ApiClient {
    pub fn new(base_url: String) -> Self {
        Self {
            client: reqwest::Client::new(),
            base_url,
        }
    }

    /// Get the base URL for the API
    pub fn base_url(&self) -> &str {
        &self.base_url
    }

    /// Fetch all themes from the backend
    pub async fn get_themes(&self) -> Result<Vec<Theme>, String> {
        let url = format!("{}/v1/theme", self.base_url);
        
        self.client
            .get(&url)
            .send()
            .await
            .map_err(|e| format!("Failed to send request: {}", e))?
            .json::<Vec<Theme>>()
            .await
            .map_err(|e| format!("Failed to parse response: {}", e))
    }

    /// Fetch a specific theme by ID
    pub async fn get_theme(&self, theme_id: &str) -> Result<Theme, String> {
        let url = format!("{}/v1/theme/{}", self.base_url, theme_id);
        
        self.client
            .get(&url)
            .send()
            .await
            .map_err(|e| format!("Failed to send request: {}", e))?
            .json::<Theme>()
            .await
            .map_err(|e| format!("Failed to parse response: {}", e))
    }

    /// Fetch all schedules from the backend
    pub async fn get_schedules(&self) -> Result<Vec<Schedule>, String> {
        let url = format!("{}/v1/schedule", self.base_url);
        
        self.client
            .get(&url)
            .send()
            .await
            .map_err(|e| format!("Failed to send request: {}", e))?
            .json::<Vec<Schedule>>()
            .await
            .map_err(|e| format!("Failed to parse response: {}", e))
    }

    /// Fetch a specific schedule by ID
    pub async fn get_schedule(&self, schedule_id: &str) -> Result<Schedule, String> {
        let url = format!("{}/v1/schedule/{}", self.base_url, schedule_id);
        
        self.client
            .get(&url)
            .send()
            .await
            .map_err(|e| format!("Failed to send request: {}", e))?
            .json::<Schedule>()
            .await
            .map_err(|e| format!("Failed to parse response: {}", e))
    }

    /// Initialize an upload and get a presigned URL for direct upload
    pub async fn init_upload(&self, request: InitUploadRequest) -> Result<InitUploadResponse, String> {
        let url = format!("{}/v1/upload", self.base_url);
        
        self.client
            .post(&url)
            .json(&request)
            .send()
            .await
            .map_err(|e| format!("Failed to send request: {}", e))?
            .json::<InitUploadResponse>()
            .await
            .map_err(|e| format!("Failed to parse response: {}", e))
    }

    /// Upload a file to a presigned URL (e.g., Azure Blob Storage SAS URL)
    pub async fn upload_file(&self, presigned_url: &str, file_data: Vec<u8>) -> Result<(), String> {
        self.client
            .put(presigned_url)
            .header("x-ms-blob-type", "BlockBlob")
            .body(file_data)
            .send()
            .await
            .map_err(|e| format!("Failed to upload file: {}", e))?;
        
        Ok(())
    }

    /// Delete recordings by client ID
    pub async fn delete_by_client_id(&self, client_id: &str) -> Result<(), String> {
        let url = format!("{}/v1/recordings/{}", self.base_url, client_id);
        
        self.client
            .delete(&url)
            .send()
            .await
            .map_err(|e| format!("Failed to send request: {}", e))?;
        
        Ok(())
    }

    /// Delete recordings by session ID
    pub async fn delete_by_session_id(&self, client_id: &str, session_id: &str) -> Result<(), String> {
        let url = format!("{}/v1/recordings/{}/{}", self.base_url, client_id, session_id);
        
        self.client
            .delete(&url)
            .send()
            .await
            .map_err(|e| format!("Failed to send request: {}", e))?;
        
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
        
        self.client
            .delete(&url)
            .send()
            .await
            .map_err(|e| format!("Failed to send request: {}", e))?;
        
        Ok(())
    }
}
