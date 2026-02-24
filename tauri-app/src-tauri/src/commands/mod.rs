use crate::api_client;
use crate::database;
use crate::models::{theme::Theme, schedule::Schedule, Recording, UploadStatus};
use crate::recording;
use tauri::{AppHandle, State, Manager};
use base64::Engine;
use serde::Serialize;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveRecordingResponse {
    pub recording: Recording,
    pub duration_seconds: f64,
}

/// Tauri command to get all recordings from the database
#[tauri::command]
pub fn get_recordings(db: State<database::Database>) -> Result<Vec<Recording>, String> {
    database::get_recordings(db.connection())
}

/// Tauri command to delete a recording by ID
/// Deletes both the database entry and the FLAC file from disk
#[tauri::command]
pub fn delete_recording(
    db: State<database::Database>,
    app_handle: AppHandle,
    recording_id: String,
) -> Result<(), String> {
    // Delete from database and get recording info (for file path)
    let recording = database::delete_recording_by_id(db.connection(), &recording_id)?;
    
    // Delete FLAC file from disk if filename exists
    if let Some(filename) = recording.file_name {
        let app_data_dir = app_handle
            .path()
            .app_data_dir()
            .map_err(|e| format!("Failed to get app data directory: {}", e))?;
        
        let recordings_dir = app_data_dir.join("recordings");
        let file_path = recordings_dir.join(&filename);
        
        // Attempt to delete the file (don't fail if file doesn't exist)
        if file_path.exists() {
            std::fs::remove_file(&file_path)
                .map_err(|e| format!("Failed to delete recording file: {}", e))?;
            println!("Deleted recording file: {}", file_path.display());
        } else {
            println!("Recording file not found (already deleted?): {}", file_path.display());
        }
    }
    
    println!("Recording deleted successfully: {}", recording_id);
    Ok(())
}

/// Tauri command to insert a test recording
#[tauri::command]
pub fn insert_test_recording(db: State<database::Database>) -> Result<(), String> {
    database::insert_test_recording(db.connection())
}

/// Tauri command to fetch all themes from the backend API
#[tauri::command]
pub async fn fetch_themes(api_client: State<'_, api_client::ApiClient>) -> Result<Vec<Theme>, String> {
    api_client.get_themes().await
}

/// Tauri command to fetch a specific theme by ID
#[tauri::command]
pub async fn fetch_theme(api_client: State<'_, api_client::ApiClient>, theme_id: String) -> Result<Theme, String> {
    api_client.get_theme(&theme_id).await
}

/// Tauri command to fetch all schedules from the backend API
#[tauri::command]
pub async fn fetch_schedules(api_client: State<'_, api_client::ApiClient>) -> Result<Vec<Schedule>, String> {
    api_client.get_schedules().await
}

/// Tauri command to fetch a specific schedule by ID
#[tauri::command]
pub async fn fetch_schedule(api_client: State<'_, api_client::ApiClient>, schedule_id: String) -> Result<Schedule, String> {
    api_client.get_schedule(&schedule_id).await
}

/// Tauri command to get the API base URL
#[tauri::command]
pub fn get_api_base_url(api_client: State<'_, api_client::ApiClient>) -> Result<String, String> {
    Ok(api_client.base_url().to_string())
}

/// Tauri command to save a recording
/// 
/// Receives WAV audio data as base64 string, saves it as FLAC, and creates database entry
#[tauri::command]
pub fn save_recording(
    app_handle: AppHandle,
    db: State<database::Database>,
    item_id: String,
    client_id: String,
    audio_data_base64: String,
) -> Result<SaveRecordingResponse, String> {
    println!("save_recording called for item: {}", item_id);
    
    // Decode base64 audio data
    let audio_data = base64::engine::general_purpose::STANDARD
        .decode(&audio_data_base64)
        .map_err(|e| format!("Failed to decode base64 audio data: {}", e))?;
    
    // Get recordings directory
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;
    
    let recordings_dir = app_data_dir.join("recordings");
    
    // Save audio as FLAC and get metadata
    let audio_metadata = recording::save_recording_as_flac(&audio_data, &recordings_dir)?;
    
    println!("Saved FLAC file: {}, duration: {:.2}s", 
        audio_metadata.filename, audio_metadata.duration_seconds);
    
    // Generate recording ID from filename (without extension)
    let recording_id = audio_metadata.filename.trim_end_matches(".flac").to_string();
    
    // Store duration for response
    let duration_seconds = audio_metadata.duration_seconds;
    
    // Create metadata JSON
    let metadata_json = serde_json::json!({
        "recordingId": recording_id,
        "clientId": client_id,
        "clientPlatformName": std::env::consts::OS,
        "clientPlatformVersion": "Tauri",
        "itemId": item_id,
        "recordingTimestamp": chrono::Utc::now().to_rfc3339(),
        "recordingDuration": audio_metadata.duration_seconds,
        "recordingSampleRate": audio_metadata.sample_rate,
        "recordingBitDepth": audio_metadata.bit_depth,
        "recordingNumberOfChannels": audio_metadata.channels,
        "contentType": audio_metadata.content_type,
    });
    
    // Create Recording object
    let recording = Recording {
        recording_id: recording_id.clone(),
        item_id: Some(item_id),
        file_name: Some(audio_metadata.filename),
        client_id: Some(client_id),
        timestamp: chrono::Utc::now().to_rfc3339(),
        upload_status: Some(UploadStatus::Pending),
        metadata: Some(metadata_json.to_string()),
    };
    
    // Save to database
    database::save_recording(db.connection(), &recording)?;
    
    println!("Recording saved successfully: {}", recording_id);
    
    Ok(SaveRecordingResponse {
        recording,
        duration_seconds,
    })
}

/// Tauri command to download a media file and cache it locally
/// 
/// Downloads media from the API server and saves to local cache directory.
/// Returns the file data as base64 for creating a blob URL in the frontend.
#[tauri::command]
pub async fn download_media(
    app_handle: AppHandle,
    api_client: State<'_, api_client::ApiClient>,
    url: String,
) -> Result<Vec<u8>, String> {
    println!("download_media called for URL: {}", url);
    
    // Always extract just the filename from any URL format
    // This handles "/v1/media/file.mp4", "http://server/v1/media/file.mp4", or just "file.mp4"
    let filename = url.split('/')
        .last()
        .ok_or_else(|| "Invalid URL: cannot extract filename".to_string())?
        .to_string();
    
    println!("Extracted filename: {}", filename);
    
    // Get cache directory
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;
    
    let cache_dir = app_data_dir.join("media_cache");
    
    // Create cache directory if it doesn't exist
    std::fs::create_dir_all(&cache_dir)
        .map_err(|e| format!("Failed to create cache directory: {}", e))?;
    
    let local_path = cache_dir.join(&filename);
    
    // Check if file already exists in cache
    if local_path.exists() {
        println!("File already cached at: {}", local_path.display());
        // Read and return the cached file
        return std::fs::read(&local_path)
            .map_err(|e| format!("Failed to read cached file: {}", e));
    }
    
    // Download the file
    println!("Downloading media file: {}", filename);
    let file_data = api_client.download_media(&filename).await?;
    
    println!("Downloaded {} bytes", file_data.len());
    
    // Save to cache
    std::fs::write(&local_path, &file_data)
        .map_err(|e| format!("Failed to write file to cache: {}", e))?;
    
    println!("Cached media file at: {}", local_path.display());
    
    Ok(file_data)
}
