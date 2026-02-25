use serde::{Deserialize, Serialize};

use super::UploadStatus;

/// Represents a recording entry in the database.
///
/// Ported from Recorder.Core/Models/Recording.cs
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Recording {
    /// Primary key - unique identifier for the recording
    pub recording_id: String,
    
    /// Identifier of the schedule item linked to this recording
    pub item_id: Option<String>,
    
    /// Filename of recording (last path component)
    pub file_name: Option<String>,
    
    /// Client identifier
    pub client_id: Option<String>,
    
    /// UTC timestamp of when the recording was created
    pub timestamp: String, // ISO 8601 format
    
    /// Upload status - see UploadStatus enum
    pub upload_status: Option<UploadStatus>,
    
    /// JSON payload of recording metadata
    pub metadata: Option<String>,
}
