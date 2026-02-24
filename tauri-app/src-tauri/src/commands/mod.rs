use crate::api_client;
use crate::database;
use crate::models::{theme::Theme, schedule::Schedule, Recording, UploadStatus};
use crate::recording;
use tauri::{AppHandle, State, Manager};
use base64::Engine;

/// Tauri command to get all recordings from the database
#[tauri::command]
pub fn get_recordings(db: State<database::Database>) -> Result<Vec<Recording>, String> {
    database::get_recordings(db.connection())
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
) -> Result<Recording, String> {
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
    Ok(recording)
}
