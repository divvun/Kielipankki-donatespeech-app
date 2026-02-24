use crate::api_client;
use crate::database;
use crate::models::{theme::Theme, schedule::Schedule, Recording, UploadStatus};
use tauri::State;

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
