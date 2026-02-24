/**
 * Upload status of a recording in the database.
 *
 * Maps to Rust enum: src-tauri/src/models/upload_status.rs
 */
export enum UploadStatus {
  Unknown = "unknown",
  Pending = "pending",
  Uploaded = "uploaded",
  Deleted = "deleted",
}
