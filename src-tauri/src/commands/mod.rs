use crate::api_client;
use crate::database;
use std::path::Path;

/// Log only in debug builds (cfg!(debug_assertions) is optimized away in release)
macro_rules! debug_log {
    ($($arg:tt)*) => {
        if cfg!(debug_assertions) {
            println!($($arg)*);
        }
    };
}

use crate::models::{
    schedule::{Schedule, ScheduleAvailability},
    theme::{Theme, ThemeAvailability},
    Recording,
    UploadStatus,
};
use crate::recording;
use tauri::{AppHandle, State, Manager};
use base64::Engine;
use serde::{Serialize, Deserialize};
use std::hash::{Hash, Hasher};

fn media_cache_file_name(media_source: &str) -> String {
    let mut hasher = std::collections::hash_map::DefaultHasher::new();
    media_source.hash(&mut hasher);
    let hash = hasher.finish();

    let trimmed = media_source
        .split(['?', '#'])
        .next()
        .unwrap_or(media_source);
    let extension = trimmed
        .rsplit('.')
        .next()
        .filter(|ext| !ext.is_empty() && ext.len() <= 10 && ext.chars().all(|c| c.is_ascii_alphanumeric()))
        .map(|ext| ext.to_lowercase());

    match extension {
        Some(ext) => format!("{:016x}.{}", hash, ext),
        None => format!("{:016x}", hash),
    }
}

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
            debug_log!("Deleted recording file: {}", file_path.display());
        } else {
            debug_log!("Recording file not found (already deleted?): {}", file_path.display());
        }
    }
    
    debug_log!("Recording deleted successfully: {}", recording_id);
    Ok(())
}

/// Tauri command to insert a test recording
#[tauri::command]
pub fn insert_test_recording(db: State<database::Database>) -> Result<(), String> {
    database::insert_test_recording(db.connection())
}

/// Tauri command to fetch all themes from the backend API
#[tauri::command]
pub async fn fetch_themes(api_client: State<'_, api_client::ApiClient>) -> Result<Vec<ThemeAvailability>, String> {
    api_client.get_themes().await
}

/// Tauri command to fetch a specific theme by ID
#[tauri::command]
pub async fn fetch_theme(
    api_client: State<'_, api_client::ApiClient>,
    theme_id: String,
    lang: String,
) -> Result<Theme, String> {
    api_client.get_theme(&theme_id, &lang).await
}

/// Tauri command to fetch all schedules from the backend API
#[tauri::command]
pub async fn fetch_schedules(api_client: State<'_, api_client::ApiClient>) -> Result<Vec<ScheduleAvailability>, String> {
    api_client.get_schedules().await
}

/// Tauri command to fetch a specific schedule by ID
#[tauri::command]
pub async fn fetch_schedule(
    api_client: State<'_, api_client::ApiClient>,
    schedule_id: String,
    lang: String,
    theme_id: Option<String>,
) -> Result<Schedule, String> {
    api_client
        .get_schedule(&schedule_id, &lang, theme_id.as_deref())
        .await
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
    debug_log!("save_recording called for item: {}", item_id);

    let audio_data = base64::engine::general_purpose::STANDARD
        .decode(&audio_data_base64)
        .map_err(|e| format!("Failed to decode base64 audio data: {}", e))?;

    save_recording_bytes(&app_handle, &db, item_id, client_id, audio_data, None)
}

/// Tauri command to save a recording directly from a file path.
///
/// Reads the audio file in Rust (no base64 round-trip through the WebView),
/// converts/stores it as FLAC, creates a database entry, deletes the source
/// file, and returns the recording metadata.  This is the preferred path for
/// native recordings on all platforms.
#[tauri::command]
pub fn save_recording_from_path(
    app_handle: AppHandle,
    db: State<database::Database>,
    file_path: String,
    item_id: String,
    client_id: String,
    duration_seconds: Option<f64>,
) -> Result<SaveRecordingResponse, String> {
    debug_log!("save_recording_from_path called: item={} path={}", item_id, file_path);

    // Basic path safety: must be absolute and contain no parent-dir traversal.
    let path = std::path::Path::new(&file_path);
    if !path.is_absolute() {
        return Err(format!("Recording path must be absolute, got: {}", file_path));
    }
    for component in path.components() {
        if component == std::path::Component::ParentDir {
            return Err(format!("Recording path must not contain '..': {}", file_path));
        }
    }

    // Resolve symlinks if the file already exists; fall back to the raw path so
    // the read attempt below gives a clear "not found" error rather than a
    // cryptic canonicalize failure (which varies across iOS/macOS sandbox paths).
    let real_path = std::fs::canonicalize(path).unwrap_or_else(|_| path.to_path_buf());

    // Verify the resolved path stays inside the app's allowed directories.
    // Detailed message so the actual paths appear in the web console on failure.
    if !is_allowed_path(&app_handle, &real_path)? {
        let path_api = app_handle.path();
        let app_data = path_api.app_data_dir().unwrap_or_default();
        let temp     = path_api.temp_dir().unwrap_or_default();
        let cache    = path_api.app_cache_dir().unwrap_or_default();
        let caches_root = cache.parent().map(|p| p.to_path_buf()).unwrap_or(cache);
        let canon_app_data   = std::fs::canonicalize(&app_data).unwrap_or(app_data);
        let canon_temp       = std::fs::canonicalize(&temp).unwrap_or(temp);
        let canon_cache_root = std::fs::canonicalize(&caches_root).unwrap_or(caches_root);
        return Err(format!(
            "Access denied: '{}' (resolved: '{}') is not under app_data_dir='{}', temp_dir='{}', or caches_root='{}'",
            file_path,
            real_path.display(),
            canon_app_data.display(),
            canon_temp.display(),
            canon_cache_root.display(),
        ));
    }

    let audio_data = std::fs::read(&real_path)
        .map_err(|e| format!("Failed to read recording file '{}': {}", real_path.display(), e))?;

    let response = save_recording_bytes(&app_handle, &db, item_id, client_id, audio_data, duration_seconds)?;

    // Remove source file now that the FLAC copy is safely stored.
    let _ = std::fs::remove_file(&real_path);

    Ok(response)
}

fn save_recording_bytes(
    app_handle: &AppHandle,
    db: &State<database::Database>,
    item_id: String,
    client_id: String,
    audio_data: Vec<u8>,
    duration_seconds_hint: Option<f64>,
) -> Result<SaveRecordingResponse, String> {
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;

    let recordings_dir = app_data_dir.join("recordings");

    let audio_metadata = recording::save_recording_as_flac(&audio_data, &recordings_dir)?;

    debug_log!("Saved FLAC file: {}, duration: {:.2}s",
        audio_metadata.filename, audio_metadata.duration_seconds);

    let recording_id = audio_metadata.filename.trim_end_matches(".flac").to_string();
    // Prefer the OS-measured duration from the recording plugin.  Fall back to
    // what audio parsing could determine (works for WAV/FLAC; 0 for M4A/AAC
    // containers where we cannot parse duration without a full demuxer).
    let duration_seconds = duration_seconds_hint
        .filter(|v| v.is_finite() && *v > 0.0)
        .map(|v| v.floor())
        .unwrap_or(audio_metadata.duration_seconds);
    let timestamp = chrono::Utc::now().to_rfc3339();

    let metadata_json = serde_json::json!({
        "recordingId": recording_id,
        "clientId": client_id,
        "clientPlatformName": std::env::consts::OS,
        "clientPlatformVersion": "Tauri",
        "itemId": item_id,
        "recordingTimestamp": timestamp,
        "recordingDuration": duration_seconds,
        "recordingSampleRate": audio_metadata.sample_rate,
        "recordingBitDepth": audio_metadata.bit_depth,
        "recordingNumberOfChannels": audio_metadata.channels,
        "contentType": audio_metadata.content_type,
    });

    let recording = Recording {
        recording_id: recording_id.clone(),
        item_id: Some(item_id),
        file_name: Some(audio_metadata.filename),
        client_id: Some(client_id),
        timestamp,
        upload_status: Some(UploadStatus::Pending),
        metadata: Some(metadata_json.to_string()),
    };

    database::save_recording(db.connection(), &recording)?;

    debug_log!("Recording saved successfully: {}", recording_id);

    Ok(SaveRecordingResponse { recording, duration_seconds })
}

/// Check if a string is a YLE program ID (format: digits-hexstring, no slashes)
fn is_yle_program_id(media_source: &str) -> bool {
    !media_source.contains('/') && !media_source.contains('.') && media_source.contains('-')
}

/// Tauri command to download a media file and cache it locally
/// 
/// Downloads media from the API server and saves to local cache directory.
/// For YLE items, first fetches from /v1/yle-media/{program_id} endpoint.
/// Returns the file data as base64 for creating a blob URL in the frontend.
#[tauri::command]
pub async fn download_media(
    app_handle: AppHandle,
    api_client: State<'_, api_client::ApiClient>,
    url: String,
) -> Result<Vec<u8>, String> {
    debug_log!("download_media called for source: {}", url);
    
    // For YLE program IDs, fetch from the dedicated YLE endpoint
    if is_yle_program_id(&url) {
        debug_log!("Detected YLE program ID: {}", url);
        let yle_json_bytes = api_client.get_yle_media(&url).await?;
        return Ok(yle_json_bytes);
    }
    
    // Get cache directory
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;
    
    let cache_dir = app_data_dir.join("media_cache");
    
    // Create cache directory if it doesn't exist
    std::fs::create_dir_all(&cache_dir)
        .map_err(|e| format!("Failed to create cache directory: {}", e))?;
    
    let cache_file_name = media_cache_file_name(&url);
    let local_path = cache_dir.join(&cache_file_name);
    
    // Check if file already exists in cache
    if local_path.exists() {
        debug_log!("File already cached at: {}", local_path.display());
        // Read and return the cached file
        return std::fs::read(&local_path)
            .map_err(|e| format!("Failed to read cached file: {}", e));
    }
    
    // Download the file
    debug_log!("Downloading media source: {}", url);
    let file_data = api_client.download_media(&url).await?;
    
    debug_log!("Downloaded {} bytes", file_data.len());
    
    // Save to cache
    std::fs::write(&local_path, &file_data)
        .map_err(|e| format!("Failed to write file to cache: {}", e))?;
    
    debug_log!("Cached media file at: {}", local_path.display());
    
    Ok(file_data)
}

/// Tauri command to upload a single recording to the backend
///
/// Uploads a recording by ID, reads the file, sends to Azure Blob Storage,
/// and updates the database status to "Uploaded"
#[tauri::command]
pub async fn upload_recording(
    app_handle: AppHandle,
    db: State<'_, database::Database>,
    api_client: State<'_, api_client::ApiClient>,
    recording_id: String,
) -> Result<(), String> {
    debug_log!("upload_recording called for: {}", recording_id);
    upload_recording_impl(&app_handle, &db, &api_client, recording_id).await
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
    debug_log!("=== upload_pending_recordings called ===");
    
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
    debug_log!("Found {} real pending recordings (filtered out test recordings)", total_count);
    
    if total_count == 0 {
        return Ok("No pending recordings to upload".to_string());
    }
    
    let mut uploaded_count = 0;
    let mut failed_count = 0;
    
    for (index, recording) in real_recordings.iter().enumerate() {
        let recording_id = recording.recording_id.clone();
        debug_log!("Uploading recording {}/{}: {}", index + 1, total_count, recording_id);
        
        // Upload using the single upload command logic
        match upload_recording_impl(
            &app_handle,
            &db,
            &api_client,
            recording_id.clone(),
        ).await {
            Ok(()) => {
                debug_log!("✓ Upload successful: {}", recording_id);
                uploaded_count += 1;
            }
            Err(e) => {
                debug_log!("✗ Upload failed for {}: {}", recording_id, e);
                failed_count += 1;
            }
        }
    }
    
    let message = format!(
        "Upload complete: {} successful, {} failed out of {} total",
        uploaded_count, failed_count, total_count
    );
    debug_log!("=== {} ===", message);
    
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
    
    debug_log!("Updating recordings with test-client-id to use: {}", real_client_id);
    
    // Update the client_id in the recordings table
    let updated = {
        let conn = db.connection()
            .lock()
            .map_err(|e| format!("Failed to lock database: {}", e))?;
        
        conn.execute(
            "UPDATE Recording SET ClientId = ?1 WHERE ClientId = ?2",
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
                            "UPDATE Recording SET Metadata = ?1 WHERE RecordingId = ?2",
                            params![updated_metadata, recording.recording_id],
                        ).map_err(|e| format!("Failed to update metadata: {}", e))?;
                    }
                }
            }
        }
    }
    
    debug_log!("Updated {} recordings with new client ID", updated);
    Ok(updated)
}

fn is_allowed_path(app_handle: &AppHandle, canonical_path: &Path) -> Result<bool, String> {
    let path_api = app_handle.path();
    let app_data_dir = path_api
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;
    let temp_dir = path_api
        .temp_dir()
        .map_err(|e| format!("Failed to get temp directory: {}", e))?;
    // iOS audio plugin saves recordings directly to Library/Caches (not to the
    // app-specific subdirectory returned by app_cache_dir), so we allow the
    // parent of app_cache_dir, i.e. the raw Library/Caches directory.
    let cache_dir = path_api.app_cache_dir()
        .map_err(|e| format!("Failed to get cache directory: {}", e))?;
    let caches_root = cache_dir.parent()
        .map(|p| p.to_path_buf())
        .unwrap_or(cache_dir);

    // Canonicalize base dirs so symlink differences (e.g. /var vs /private/var on iOS/macOS)
    // don't cause false negatives in the starts_with check.
    let canonical_app_data = std::fs::canonicalize(&app_data_dir).unwrap_or(app_data_dir);
    let canonical_temp = std::fs::canonicalize(&temp_dir).unwrap_or(temp_dir);
    let canonical_cache = std::fs::canonicalize(&caches_root).unwrap_or(caches_root);

    Ok(canonical_path.starts_with(&canonical_app_data)
        || canonical_path.starts_with(&canonical_temp)
        || canonical_path.starts_with(&canonical_cache))
}

/// Tauri command to read a file and return its contents as base64
#[tauri::command]
pub fn read_file_as_base64(app_handle: AppHandle, file_path: String) -> Result<String, String> {
    let canonical_path = std::fs::canonicalize(&file_path)
        .map_err(|e| format!("Invalid path {}: {}", file_path, e))?;

    if !is_allowed_path(&app_handle, &canonical_path)? {
        return Err("Access denied: path is outside allowed app directories".to_string());
    }

    let data = std::fs::read(&canonical_path)
        .map_err(|e| format!("Failed to read file {}: {}", file_path, e))?;

    let base64_data = base64::engine::general_purpose::STANDARD.encode(&data);
    Ok(base64_data)
}

/// Tauri command to delete a file
#[tauri::command]
pub fn delete_file(app_handle: AppHandle, file_path: String) -> Result<(), String> {
    let canonical_path = std::fs::canonicalize(&file_path)
        .map_err(|e| format!("Invalid path {}: {}", file_path, e))?;

    if !is_allowed_path(&app_handle, &canonical_path)? {
        return Err("Access denied: path is outside allowed app directories".to_string());
    }

    if canonical_path.exists() {
        std::fs::remove_file(&canonical_path)
            .map_err(|e| format!("Failed to delete file {}: {}", file_path, e))?;
    }
    Ok(())
}
