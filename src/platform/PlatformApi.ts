import type {
  Recording,
  Schedule,
  ScheduleAvailability,
  Theme,
  ThemeAvailability,
} from "../types";

export interface SaveRecordingPayload {
  itemId: string;
  clientId: string;
  audioDataBase64: string;
  durationSeconds?: number;
}

export interface SaveRecordingCommandResponse {
  recording: Recording;
  durationSeconds: number;
}

export interface PlatformApi {
  fixClientIds(realClientId: string): Promise<number>;
  fetchThemes(): Promise<ThemeAvailability[]>;
  fetchTheme(themeId: string, lang: string): Promise<Theme>;
  fetchSchedules(): Promise<ScheduleAvailability[]>;
  fetchSchedule(scheduleId: string, lang: string): Promise<Schedule>;
  getRecordings(): Promise<Recording[]>;
  insertTestRecording(): Promise<void>;
  deleteRecording(recordingId: string): Promise<void>;
  uploadPendingRecordings(): Promise<string>;
  getApiBaseUrl(): Promise<string>;
  downloadMedia(url: string): Promise<number[]>;
  readFileAsBase64(filePath: string): Promise<string>;
  saveRecording(
    payload: SaveRecordingPayload,
  ): Promise<SaveRecordingCommandResponse>;
  deleteFile(filePath: string): Promise<void>;
}
