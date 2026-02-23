/// Constants representing the upload status of a recording in the database.
///
/// Ported from Recorder.Core/Models/UploadStatus.cs
pub struct UploadStatus;

impl UploadStatus {
    pub const UNKNOWN: &'static str = "unknown";
    pub const PENDING: &'static str = "pending";
    pub const UPLOADED: &'static str = "uploaded";
    pub const DELETED: &'static str = "deleted";
}
