mod api_client;
mod commands;
mod database;
mod models;
mod recording;

use tauri::Manager;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_audio_recorder::init())
        .setup(|app| {
            // Initialize database and manage it as state
            let db = database::Database::new(app.handle())
                .map_err(|e| format!("Failed to initialize database: {}", e))?;
            app.manage(db);

            // Initialize API client with localhost for development
            let api_client = api_client::ApiClient::new("http://localhost:8000".to_string());
            app.manage(api_client);
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            commands::get_recordings,
            commands::delete_recording,
            commands::insert_test_recording,
            commands::fetch_themes,
            commands::fetch_theme,
            commands::fetch_schedules,
            commands::fetch_schedule,
            commands::get_api_base_url,
            commands::download_media,
            commands::save_recording,
            commands::upload_recording,
            commands::upload_pending_recordings,
            commands::fix_client_ids,
            commands::read_file_as_base64,
            commands::delete_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
