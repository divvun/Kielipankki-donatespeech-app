/**
 * Constants representing the upload status of a recording in the database.
 * 
 * Maps to Rust: src-tauri/src/models/upload_status.rs
 */
export const UploadStatus = {
  UNKNOWN: 'unknown',
  PENDING: 'pending',
  UPLOADED: 'uploaded',
  DELETED: 'deleted',
} as const;

export type UploadStatusValue = typeof UploadStatus[keyof typeof UploadStatus];
