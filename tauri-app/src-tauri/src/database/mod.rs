use rusqlite::{Connection, OpenFlags};
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::Manager;
use crate::models::{Recording, UploadStatus};

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
        
        // Initialize tables
        initialize_tables(&connection)?;
        
        Ok(Self {
            connection: Mutex::new(connection),
        })
    }
    
    pub fn connection(&self) -> &Mutex<Connection> {
        &self.connection
    }
}

/// Initialize database tables
fn initialize_tables(connection: &Connection) -> Result<(), String> {
    // Create Recording table matching C# schema
    connection
        .execute(
            "CREATE TABLE IF NOT EXISTS Recording (
                RecordingId TEXT PRIMARY KEY,
                ItemId TEXT,
                FileName TEXT,
                ClientId TEXT,
                Timestamp TEXT NOT NULL,
                UploadStatus TEXT,
                Metadata TEXT
            )",
            [],
        )
        .map_err(|e| format!("Failed to create Recording table: {}", e))?;
    
    println!("Database tables initialized");
    Ok(())
}

/// Get all recordings from the database
pub fn get_recordings(connection: &Mutex<Connection>) -> Result<Vec<Recording>, String> {
    let conn = connection
        .lock()
        .map_err(|e| format!("Failed to lock connection: {}", e))?;
    
    let mut stmt = conn
        .prepare("SELECT RecordingId, ItemId, FileName, ClientId, Timestamp, UploadStatus, Metadata FROM Recording")
        .map_err(|e| format!("Failed to prepare statement: {}", e))?;
    
    let recordings = stmt
        .query_map([], |row| {
            Ok(Recording {
                recording_id: row.get(0)?,
                item_id: row.get(1)?,
                file_name: row.get(2)?,
                client_id: row.get(3)?,
                timestamp: row.get(4)?,
                upload_status: row.get::<_, Option<String>>(5)?.and_then(|s| {
                    // Parse string to UploadStatus enum
                    match s.to_lowercase().as_str() {
                        "unknown" => Some(UploadStatus::Unknown),
                        "pending" => Some(UploadStatus::Pending),
                        "uploaded" => Some(UploadStatus::Uploaded),
                        "deleted" => Some(UploadStatus::Deleted),
                        _ => None,
                    }
                }),
                metadata: row.get(6)?,
            })
        })
        .map_err(|e| format!("Failed to query recordings: {}", e))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("Failed to collect recordings: {}", e))?;
    
    Ok(recordings)
}
