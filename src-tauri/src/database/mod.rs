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

/// Insert a test recording for IPC verification
pub fn insert_test_recording(connection: &Mutex<Connection>) -> Result<(), String> {
    let conn = connection
        .lock()
        .map_err(|e| format!("Failed to lock connection: {}", e))?;
    
    let recording_id = format!("test-{}", chrono::Utc::now().timestamp());
    let timestamp = chrono::Utc::now().to_rfc3339();
    
    conn.execute(
        "INSERT INTO Recording (RecordingId, ItemId, FileName, ClientId, Timestamp, UploadStatus, Metadata) 
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        rusqlite::params![
            recording_id,
            "test-item-123",
            "test-recording.wav",
            "test-client-456",
            timestamp,
            "pending",
            r#"{"duration": 30, "sampleRate": 44100}"#,
        ],
    )
    .map_err(|e| format!("Failed to insert test recording: {}", e))?;
    
    println!("Inserted test recording: {}", recording_id);
    Ok(())
}

/// Save a recording to the database
pub fn save_recording(connection: &Mutex<Connection>, recording: &Recording) -> Result<(), String> {
    let conn = connection
        .lock()
        .map_err(|e| format!("Failed to lock connection: {}", e))?;
    
    let upload_status_str = match recording.upload_status {
        Some(UploadStatus::Unknown) => Some("unknown"),
        Some(UploadStatus::Pending) => Some("pending"),
        Some(UploadStatus::Uploaded) => Some("uploaded"),
        Some(UploadStatus::Deleted) => Some("deleted"),
        None => None,
    };
    
    conn.execute(
        "INSERT INTO Recording (RecordingId, ItemId, FileName, ClientId, Timestamp, UploadStatus, Metadata) 
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        rusqlite::params![
            &recording.recording_id,
            &recording.item_id,
            &recording.file_name,
            &recording.client_id,
            &recording.timestamp,
            upload_status_str,
            &recording.metadata,
        ],
    )
    .map_err(|e| format!("Failed to insert recording: {}", e))?;
    
    println!("Saved recording: {}", recording.recording_id);
    Ok(())
}

/// Delete a recording from the database by recording ID
pub fn delete_recording_by_id(connection: &Mutex<Connection>, recording_id: &str) -> Result<Recording, String> {
    let conn = connection
        .lock()
        .map_err(|e| format!("Failed to lock connection: {}", e))?;
    
    // First, fetch the recording to return its data (especially file_name for file deletion)
    let recording: Recording = conn
        .query_row(
            "SELECT RecordingId, ItemId, FileName, ClientId, Timestamp, UploadStatus, Metadata FROM Recording WHERE RecordingId = ?1",
            rusqlite::params![recording_id],
            |row| {
                Ok(Recording {
                    recording_id: row.get(0)?,
                    item_id: row.get(1)?,
                    file_name: row.get(2)?,
                    client_id: row.get(3)?,
                    timestamp: row.get(4)?,
                    upload_status: row.get::<_, Option<String>>(5)?.and_then(|s| {
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
            }
        )
        .map_err(|e| format!("Failed to fetch recording before delete: {}", e))?;
    
    // Now delete the recording
    let deleted = conn
        .execute(
            "DELETE FROM Recording WHERE RecordingId = ?1",
            rusqlite::params![recording_id],
        )
        .map_err(|e| format!("Failed to delete recording: {}", e))?;
    
    if deleted == 0 {
        return Err(format!("Recording not found: {}", recording_id));
    }
    
    println!("Deleted recording: {}", recording_id);
    Ok(recording)
}

/// Get recordings by upload status
pub fn get_recordings_by_status(connection: &Mutex<Connection>, status: UploadStatus) -> Result<Vec<Recording>, String> {
    let conn = connection
        .lock()
        .map_err(|e| format!("Failed to lock connection: {}", e))?;
    
    let status_str = match status {
        UploadStatus::Unknown => "unknown",
        UploadStatus::Pending => "pending",
        UploadStatus::Uploaded => "uploaded",
        UploadStatus::Deleted => "deleted",
    };
    
    let mut stmt = conn
        .prepare("SELECT RecordingId, ItemId, FileName, ClientId, Timestamp, UploadStatus, Metadata FROM Recording WHERE UploadStatus = ?1")
        .map_err(|e| format!("Failed to prepare statement: {}", e))?;
    
    let recordings = stmt
        .query_map(rusqlite::params![status_str], |row| {
            Ok(Recording {
                recording_id: row.get(0)?,
                item_id: row.get(1)?,
                file_name: row.get(2)?,
                client_id: row.get(3)?,
                timestamp: row.get(4)?,
                upload_status: row.get::<_, Option<String>>(5)?.and_then(|s| {
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

/// Get a single recording by ID
pub fn get_recording_by_id(connection: &Mutex<Connection>, recording_id: &str) -> Result<Recording, String> {
    let conn = connection
        .lock()
        .map_err(|e| format!("Failed to lock connection: {}", e))?;
    
    conn.query_row(
        "SELECT RecordingId, ItemId, FileName, ClientId, Timestamp, UploadStatus, Metadata FROM Recording WHERE RecordingId = ?1",
        rusqlite::params![recording_id],
        |row| {
            Ok(Recording {
                recording_id: row.get(0)?,
                item_id: row.get(1)?,
                file_name: row.get(2)?,
                client_id: row.get(3)?,
                timestamp: row.get(4)?,
                upload_status: row.get::<_, Option<String>>(5)?.and_then(|s| {
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
        }
    )
    .map_err(|e| format!("Failed to get recording: {}", e))
}

/// Update recording upload status
pub fn update_recording_status(connection: &Mutex<Connection>, recording_id: &str, status: UploadStatus) -> Result<(), String> {
    let conn = connection
        .lock()
        .map_err(|e| format!("Failed to lock connection: {}", e))?;
    
    let status_str = match status {
        UploadStatus::Unknown => "unknown",
        UploadStatus::Pending => "pending",
        UploadStatus::Uploaded => "uploaded",
        UploadStatus::Deleted => "deleted",
    };
    
    let updated = conn
        .execute(
            "UPDATE Recording SET UploadStatus = ?1 WHERE RecordingId = ?2",
            rusqlite::params![status_str, recording_id],
        )
        .map_err(|e| format!("Failed to update recording status: {}", e))?;
    
    if updated == 0 {
        return Err(format!("Recording not found: {}", recording_id));
    }
    
    println!("Updated recording {} status to {}", recording_id, status_str);
    Ok(())
}
