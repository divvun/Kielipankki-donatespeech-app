use rusqlite::{Connection, OpenFlags};
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::Manager;

const DATABASE_FILENAME: &str = "Recorder.sqlitedb";

/// Database connection flags matching C# implementation:
/// - ReadWrite: open for reading and writing
/// - Create: create database if it doesn't exist
/// - SharedCache is not available in rusqlite, uses connection pool instead
const DATABASE_FLAGS: OpenFlags = OpenFlags::SQLITE_OPEN_READ_WRITE
    .union(OpenFlags::SQLITE_OPEN_CREATE);

/// Get the path to the database file in the app data directory
pub fn get_database_path(app_handle: &tauri::AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;
    
    // Ensure the directory exists
    std::fs::create_dir_all(&app_data_dir)
        .map_err(|e| format!("Failed to create app data directory: {}", e))?;
    
    Ok(app_data_dir.join(DATABASE_FILENAME))
}

/// Initialize and return a database connection
pub fn init_connection(app_handle: &tauri::AppHandle) -> Result<Connection, String> {
    let db_path = get_database_path(app_handle)?;
    
    let connection = Connection::open_with_flags(&db_path, DATABASE_FLAGS)
        .map_err(|e| format!("Failed to open database at {:?}: {}", db_path, e))?;
    
    println!("Connected to database at {:?}", db_path);
    
    Ok(connection)
}

/// Thread-safe database connection wrapper
pub struct Database {
    connection: Mutex<Connection>,
}

impl Database {
    pub fn new(app_handle: &tauri::AppHandle) -> Result<Self, String> {
        let connection = init_connection(app_handle)?;
        Ok(Self {
            connection: Mutex::new(connection),
        })
    }
    
    pub fn connection(&self) -> &Mutex<Connection> {
        &self.connection
    }
}
