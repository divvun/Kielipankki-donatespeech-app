use serde::{Deserialize, Serialize};

/// Upload status of a recording in the database.
///
/// Ported from Recorder.Core/Models/UploadStatus.cs
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum UploadStatus {
    Unknown,
    Pending,
    Uploaded,
    Deleted,
}
