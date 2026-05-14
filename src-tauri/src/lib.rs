mod api_client;
mod commands;
mod database;
mod models;
mod recording;

use tauri::Manager;
use serde::Deserialize;

#[derive(Debug, Deserialize)]
struct RecorderPluginConfig {
    #[serde(rename = "apiBaseUrl")]
    api_base_url: String,
}

#[derive(Debug, Deserialize)]
struct PluginsConfig {
    recorder: RecorderPluginConfig,
}

#[derive(Debug, Deserialize)]
struct AppConfig {
    plugins: PluginsConfig,
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

            // Read API base URL from config
            let config_value = serde_json::to_value(app.config())
                .map_err(|e| format!("Failed to serialize config: {}", e))?;
            let config: AppConfig = serde_json::from_value(config_value)
                .map_err(|e| format!("Failed to parse config: {}", e))?;
            
            let api_base_url = config.plugins.recorder.api_base_url;
            println!("Initializing API client with base URL: {}", api_base_url);

            // Initialize API client with configured URL
            let api_client = api_client::ApiClient::new(api_base_url);
            app.manage(api_client);
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
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
