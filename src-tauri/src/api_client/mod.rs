use crate::models::{
    schedule::{Schedule, ScheduleAvailability},
    theme::{Theme, ThemeAvailability},
};
use serde::{Deserialize, Serialize};
use serde::de::DeserializeOwned;

/// Log only in debug builds (cfg!(debug_assertions) is optimized away in release)
macro_rules! debug_log {
    ($($arg:tt)*) => {
        if cfg!(debug_assertions) {
            println!($($arg)*);
        }
    };
}

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
    fn schedule_matches_id(schedule: &Schedule, schedule_id: &str) -> bool {
        schedule.id.as_deref() == Some(schedule_id)
            || schedule.schedule_id.as_deref() == Some(schedule_id)
    }

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

    /// Fetch all schedules by resolving schedule entries inside themes
    pub async fn get_schedules(&self) -> Result<Vec<ScheduleAvailability>, String> {
        let themes = self.get_themes().await?;
        let mut schedules = Vec::new();

        for theme_availability in themes {
            let Some(lang) = theme_availability.available_languages.first() else {
                continue;
            };

            let theme = self.get_theme(&theme_availability.id, lang).await?;
            let Some(schedule) = theme.schedule else {
                continue;
            };

            let schedule_id = schedule
                .id
                .clone()
                .or(schedule.schedule_id.clone())
                .unwrap_or_else(|| theme_availability.id.clone());

            schedules.push(ScheduleAvailability {
                id: schedule_id,
                available_languages: theme_availability.available_languages,
            });
        }

        Ok(schedules)
    }

    /// Fetch a specific schedule by ID by reading schedule data from themes
    pub async fn get_schedule(
        &self,
        schedule_id: &str,
        lang: &str,
        theme_id: Option<&str>,
    ) -> Result<Schedule, String> {
        if let Some(theme_id) = theme_id {
            let theme = self.get_theme(theme_id, lang).await?;
            let Some(mut schedule) = theme.schedule else {
                return Err(format!(
                    "Theme '{}' has no schedule for language '{}'",
                    theme_id, lang
                ));
            };

            if !Self::schedule_matches_id(&schedule, schedule_id) {
                return Err(format!(
                    "Theme '{}' schedule does not match requested schedule '{}'",
                    theme_id, schedule_id
                ));
            }

            schedule.normalize_for_client();
            return Ok(schedule);
        }

        let themes = self.get_themes().await?;

        for theme_availability in themes {
            if !theme_availability
                .available_languages
                .iter()
                .any(|available_lang| available_lang == lang)
            {
                continue;
            }

            let theme = self.get_theme(&theme_availability.id, lang).await?;
            let Some(mut schedule) = theme.schedule else {
                continue;
            };

            if Self::schedule_matches_id(&schedule, schedule_id) {
                schedule.normalize_for_client();
                return Ok(schedule);
            }
        }

        Err(format!(
            "Schedule '{}' was not found in any theme for language '{}'",
            schedule_id, lang
        ))
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

    fn build_media_download_url(&self, media_source: &str) -> String {
        if media_source.starts_with("http://") || media_source.starts_with("https://") {
            return media_source.to_string();
        }

        if media_source.starts_with("/v1/media/") {
            return format!("{}{}", self.base_url, media_source);
        }

        if media_source.starts_with("v1/media/") {
            return format!("{}/{}", self.base_url, media_source);
        }

        let normalized_source = media_source.trim_start_matches('/');
        format!("{}/v1/media/{}", self.base_url, normalized_source)
    }

    fn build_yle_media_url(&self, yle_program_id: &str) -> String {
        let normalized_id = yle_program_id.trim_start_matches('/');
        format!("{}/v1/yle-media/{}", self.base_url, normalized_id)
    }

    /// Fetch YLE media info from the YLE-specific endpoint
    pub async fn get_yle_media(&self, yle_program_id: &str) -> Result<Vec<u8>, String> {
        let url = self.build_yle_media_url(yle_program_id);
        
        let response = self.client
            .get(&url)
            .send()
            .await
            .map_err(|e| format!("Failed to fetch YLE media: {}", e))?;

        let status = response.status();
        let response_text = response
            .text()
            .await
            .map_err(|e| format!("Failed to read response body: {}", e))?;

        let preview_limit = 4000;
        let response_preview = if response_text.chars().count() > preview_limit {
            format!(
                "{}... (truncated)",
                response_text.chars().take(preview_limit).collect::<String>()
            )
        } else {
            response_text.clone()
        };

        debug_log!(
            "[api_client] GET {}/v1/yle-media/{} status={} body={}",
            self.base_url,
            yle_program_id,
            status,
            response_preview
        );

        if !status.is_success() {
            return Err(format!(
                "YLE media fetch failed with status {}: {}",
                status,
                response_text
            ));
        }

        Ok(response_text.into_bytes())
    }

    /// Download media file from the API or an absolute media URL
    pub async fn download_media(&self, media_source: &str) -> Result<Vec<u8>, String> {
        let url = self.build_media_download_url(media_source);
        
        let response = self.client
            .get(&url)
            .send()
            .await
            .map_err(|e| format!("Failed to download media: {}", e))?;

        let status = response.status();
        let content_type = response
            .headers()
            .get(reqwest::header::CONTENT_TYPE)
            .and_then(|v| v.to_str().ok())
            .unwrap_or("<unknown>")
            .to_string();

        debug_log!(
            "[api_client] GET {} status={} content-type={}",
            url,
            status,
            content_type
        );

        if !status.is_success() {
            let error_text = response.text().await.unwrap_or_default();
            debug_log!("[api_client] media error body={}", error_text);
            return Err(format!("Media download failed with status {}: {}", status, error_text));
        }

        if content_type.contains("application/json") || content_type.starts_with("text/") {
            let body_text = response.text().await.unwrap_or_default();
            let preview_limit = 4000;
            let preview = if body_text.chars().count() > preview_limit {
                format!(
                    "{}... (truncated)",
                    body_text.chars().take(preview_limit).collect::<String>()
                )
            } else {
                body_text.clone()
            };

            debug_log!("[api_client] media response body={} ", preview);
            return Err(format!(
                "Media endpoint returned non-binary content-type {} with body: {}",
                content_type,
                preview
            ));
        }

        response.bytes()
            .await
            .map_err(|e| format!("Failed to read media bytes: {}", e))
            .map(|b| b.to_vec())
    }

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
