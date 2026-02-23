import { UploadStatus } from './UploadStatus';

/**
 * Represents a recording entry in the database.
 * 
 * Maps to Rust: src-tauri/src/models/recording.rs
 * Ported from: Recorder.Core/Models/Recording.cs
 */
export interface Recording {
  /** Primary key - unique identifier for the recording */
  recordingId: string;
  
  /** Identifier of the schedule item linked to this recording */
  itemId?: string;
  
  /** Filename of recording (last path component) */
  fileName?: string;
  
  /** Client identifier */
  clientId?: string;
  
  /** UTC timestamp of when the recording was created (ISO 8601 format) */
  timestamp: string;
  
  /** Upload status - see UploadStatus enum */
  uploadStatus?: UploadStatus;
  
  /** JSON payload of recording metadata */
  metadata?: string;
}
