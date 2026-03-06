import { invoke } from "@tauri-apps/api/core";
import type { Recording, Schedule, ThemeListItem } from "../types";
import type {
  PlatformApi,
  SaveRecordingCommandResponse,
  SaveRecordingPayload,
} from "./PlatformApi";

export const tauriPlatformApi: PlatformApi = {
  fixClientIds(realClientId) {
    return invoke<number>("fix_client_ids", { realClientId });
  },

  fetchThemes() {
    return invoke<ThemeListItem[]>("fetch_themes");
  },

  fetchSchedules() {
    return invoke<Schedule[]>("fetch_schedules");
  },

  fetchSchedule(scheduleId) {
    return invoke<Schedule>("fetch_schedule", { scheduleId });
  },

  getRecordings() {
    return invoke<Recording[]>("get_recordings");
  },

  insertTestRecording() {
    return invoke<void>("insert_test_recording");
  },

  deleteRecording(recordingId) {
    return invoke<void>("delete_recording", { recordingId });
  },

  uploadPendingRecordings() {
    return invoke<string>("upload_pending_recordings");
  },

  getApiBaseUrl() {
    return invoke<string>("get_api_base_url");
  },

  downloadMedia(url) {
    return invoke<number[]>("download_media", { url });
  },

  readFileAsBase64(filePath) {
    return invoke<string>("read_file_as_base64", { filePath });
  },

  saveRecording(payload: SaveRecordingPayload) {
    return invoke<SaveRecordingCommandResponse>("save_recording", {
      itemId: payload.itemId,
      clientId: payload.clientId,
      audioDataBase64: payload.audioDataBase64,
    });
  },

  deleteFile(filePath) {
    return invoke<void>("delete_file", { filePath });
  },
};
