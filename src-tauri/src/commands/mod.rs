use crate::api_client;
use crate::database;
use crate::models::{theme::{Theme, ThemeListItem}, schedule::Schedule, Recording, UploadStatus};
use crate::recording;
use tauri::{AppHandle, State, Manager};
use base64::Engine;
use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveRecordingResponse {
    pub recording: Recording,
    pub duration_seconds: f64,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct RecordingMetadata {
    recording_id: Option<String>,
    client_id: Option<String>,
    item_id: Option<String>,
    recording_timestamp: Option<String>,
    recording_duration: Option<f64>,
    content_type: Option<String>,
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
pub async fn fetch_themes(api_client: State<'_, api_client::ApiClient>) -> Result<Vec<ThemeListItem>, String> {
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

/// Tauri command to upload a single recording to the backend
/// 
/// Uploads a recording by ID, reads the FLAC file, sends to Azure Blob Storage, 
/// and updates the database status to "Uploaded"
#[tauri::command]
pub async fn upload_recording(
    app_handle: AppHandle,
    db: State<'_, database::Database>,
    api_client: State<'_, api_client::ApiClient>,
    recording_id: String,
) -> Result<(), String> {
    println!("upload_recording called for: {}", recording_id);
    
    // Get the recording from database
    let recording = database::get_recording_by_id(db.connection(), &recording_id)?;
    
    // Get the FLAC file path
    let filename = recording.file_name
        .ok_or_else(|| "Recording has no filename".to_string())?;
    
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;
    
    let recordings_dir = app_data_dir.join("recordings");
    let file_path = recordings_dir.join(&filename);
    
    // Check if file exists
    if !file_path.exists() {
        return Err(format!("Recording file not found: {}", file_path.display()));
    }
    
    // Read the FLAC file
    let file_data = std::fs::read(&file_path)
        .map_err(|e| format!("Failed to read recording file: {}", e))?;
    
    println!("Read {} bytes from {}", file_data.len(), filename);
    
    // Parse metadata
    let metadata_str = recording.metadata
        .ok_or_else(|| "Recording has no metadata".to_string())?;
    
    let metadata: RecordingMetadata = serde_json::from_str(&metadata_str)
        .map_err(|e| format!("Failed to parse metadata: {}", e))?;
    
    // Get clientId from metadata (primary source) or recording (fallback)
    let client_id = metadata.client_id
        .or_else(|| recording.client_id.clone())
        .filter(|id| !id.is_empty())
        .ok_or_else(|| format!("Recording {} has no valid clientId", recording_id))?;
    
    println!("Upload metadata - clientId: {}, recordingId: {:?}", client_id, metadata.recording_id);
    
    // Create upload request
    let upload_metadata = api_client::UploadMetadata {
        client_id,
        session_id: None,  // We don't track session IDs in Tauri app
        recording_id: metadata.recording_id,
        content_type: metadata.content_type,
        timestamp: metadata.recording_timestamp,
        duration: metadata.recording_duration,
        language: None,  // Not tracked yet
    };
    
    let init_request = api_client::InitUploadRequest {
        filename: filename.clone(),
        metadata: upload_metadata,
    };
    
    // Get presigned URL from backend
    println!("Requesting presigned URL...");
    let upload_response = api_client.init_upload(init_request).await?;
    
    println!("Got presigned URL, uploading file...");
    
    // Upload file to Azure Blob Storage
    api_client.upload_file(&upload_response.presigned_url, file_data).await?;
    
    println!("Upload successful, updating database status...");
    
    // Update status in database
    database::update_recording_status(db.connection(), &recording_id, UploadStatus::Uploaded)?;
    
    println!("Recording {} uploaded successfully", recording_id);
    Ok(())
}

/// Tauri command to upload all pending recordings
/// 
/// Finds all recordings with "Pending" status and uploads them one by one
#[tauri::command]
pub async fn upload_pending_recordings(
    app_handle: AppHandle,
    db: State<'_, database::Database>,
    api_client: State<'_, api_client::ApiClient>,
) -> Result<String, String> {
    println!("=== upload_pending_recordings called ===");
    
    // Get all pending recordings
    let pending_recordings = database::get_recordings_by_status(
        db.connection(), 
        UploadStatus::Pending
    )?;
    
    // Filter out test recordings (they don't have actual files)
    let real_recordings: Vec<_> = pending_recordings
        .into_iter()
        .filter(|r| !r.recording_id.starts_with("test-"))
        .collect();
    
    let total_count = real_recordings.len();
    println!("Found {} real pending recordings (filtered out test recordings)", total_count);
    
    if total_count == 0 {
        return Ok("No pending recordings to upload".to_string());
    }
    
    let mut uploaded_count = 0;
    let mut failed_count = 0;
    
    for (index, recording) in real_recordings.iter().enumerate() {
        let recording_id = recording.recording_id.clone();
        println!("Uploading recording {}/{}: {}", index + 1, total_count, recording_id);
        
        // Upload using the single upload command logic
        match upload_recording_impl(
            &app_handle,
            &db,
            &api_client,
            recording_id.clone(),
        ).await {
            Ok(()) => {
                println!("✓ Upload successful: {}", recording_id);
                uploaded_count += 1;
            }
            Err(e) => {
                println!("✗ Upload failed for {}: {}", recording_id, e);
                failed_count += 1;
            }
        }
    }
    
    let message = format!(
        "Upload complete: {} successful, {} failed out of {} total",
        uploaded_count, failed_count, total_count
    );
    println!("=== {} ===", message);
    
    Ok(message)
}

/// Internal implementation of upload_recording (reused by upload_pending_recordings)
async fn upload_recording_impl(
    app_handle: &AppHandle,
    db: &State<'_, database::Database>,
    api_client: &State<'_, api_client::ApiClient>,
    recording_id: String,
) -> Result<(), String> {
    // Get the recording from database
    let recording = database::get_recording_by_id(db.connection(), &recording_id)?;
    
    // Get the FLAC file path
    let filename = recording.file_name
        .ok_or_else(|| "Recording has no filename".to_string())?;
    
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;
    
    let recordings_dir = app_data_dir.join("recordings");
    let file_path = recordings_dir.join(&filename);
    
    // Check if file exists
    if !file_path.exists() {
        return Err(format!("Recording file not found: {}", file_path.display()));
    }
    
    // Read the FLAC file
    let file_data = std::fs::read(&file_path)
        .map_err(|e| format!("Failed to read recording file: {}", e))?;
    
    // Parse metadata
    let metadata_str = recording.metadata
        .ok_or_else(|| "Recording has no metadata".to_string())?;
    
    let metadata: RecordingMetadata = serde_json::from_str(&metadata_str)
        .map_err(|e| format!("Failed to parse metadata: {}", e))?;
    
    // Get clientId from metadata (primary source) or recording (fallback)
    let client_id = metadata.client_id
        .or_else(|| recording.client_id.clone())
        .filter(|id| !id.is_empty())
        .ok_or_else(|| format!("Recording {} has no valid clientId", recording_id))?;
    
    // Create upload request
    let upload_metadata = api_client::UploadMetadata {
        client_id,
        session_id: None,
        recording_id: metadata.recording_id,
        content_type: metadata.content_type,
        timestamp: metadata.recording_timestamp,
        duration: metadata.recording_duration,
        language: None,
    };
    
    let init_request = api_client::InitUploadRequest {
        filename: filename.clone(),
        metadata: upload_metadata,
    };
    
    // Get presigned URL from backend
    let upload_response = api_client.init_upload(init_request).await?;
    
    // Upload file to Azure Blob Storage
    api_client.upload_file(&upload_response.presigned_url, file_data).await?;
    
    // Update status in database
    database::update_recording_status(db.connection(), &recording_id, UploadStatus::Uploaded)?;
    
    Ok(())
}

/// Tauri command to update recordings with test-client-id to use the provided real client ID
#[tauri::command]
pub fn fix_client_ids(
    db: State<database::Database>,
    real_client_id: String,
) -> Result<usize, String> {
    use rusqlite::params;
    
    println!("Updating recordings with test-client-id to use: {}", real_client_id);
    
    // Update the client_id in the recordings table
    let updated = {
        let conn = db.connection()
            .lock()
            .map_err(|e| format!("Failed to lock database: {}", e))?;
        
        conn.execute(
            "UPDATE recordings SET client_id = ?1 WHERE client_id = ?2",
            params![real_client_id, "test-client-id"],
        ).map_err(|e| format!("Failed to update client IDs: {}", e))?
    }; // Lock is released here
    
    // Also update the metadata JSON for these recordings
    let recordings: Vec<Recording> = database::get_recordings(db.connection())?;
    
    for recording in recordings {
        if let Some(metadata_str) = &recording.metadata {
            if metadata_str.contains("\"clientId\":\"test-client-id\"") {
                // Parse, update, and save back
                if let Ok(mut metadata_json) = serde_json::from_str::<serde_json::Value>(metadata_str) {
                    if let Some(obj) = metadata_json.as_object_mut() {
                        obj.insert("clientId".to_string(), serde_json::Value::String(real_client_id.clone()));
                        
                        let updated_metadata = serde_json::to_string(&metadata_json)
                            .map_err(|e| format!("Failed to serialize metadata: {}", e))?;
                        
                        let conn = db.connection()
                            .lock()
                            .map_err(|e| format!("Failed to lock database: {}", e))?;
                        
                        conn.execute(
                            "UPDATE recordings SET metadata = ?1 WHERE recording_id = ?2",
                            params![updated_metadata, recording.recording_id],
                        ).map_err(|e| format!("Failed to update metadata: {}", e))?;
                    }
                }
            }
        }
    }
    
    println!("Updated {} recordings with new client ID", updated);
    Ok(updated)
}

/// Tauri command to read a file and return its contents as base64
#[tauri::command]
pub fn read_file_as_base64(file_path: String) -> Result<String, String> {
    let data = std::fs::read(&file_path)
        .map_err(|e| format!("Failed to read file {}: {}", file_path, e))?;
    
    let base64_data = base64::engine::general_purpose::STANDARD.encode(&data);
    Ok(base64_data)
}

/// Tauri command to delete a file
#[tauri::command]
pub fn delete_file(file_path: String) -> Result<(), String> {
    if std::path::Path::new(&file_path).exists() {
        std::fs::remove_file(&file_path)
            .map_err(|e| format!("Failed to delete file {}: {}", file_path, e))?;
    }
    Ok(())
}
