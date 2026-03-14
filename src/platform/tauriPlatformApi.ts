import { invoke } from "@tauri-apps/api/core";
import type { Recording, Schedule, ThemeListItem } from "../types";
import type {
  PlatformApi,
  SaveRecordingCommandResponse,
  SaveRecordingPayload,
} from "./PlatformApi";

function getStateImageUrl(state: unknown): string | undefined {
  if (!state || typeof state !== "object") {
    return undefined;
  }

  const candidate = state as { url?: unknown; imageUrl?: unknown };
  if (typeof candidate.url === "string" && candidate.url.length > 0) {
    return candidate.url;
  }

  if (typeof candidate.imageUrl === "string" && candidate.imageUrl.length > 0) {
    return candidate.imageUrl;
  }

  return undefined;
}

function normalizeSchedule(schedule: Schedule): Schedule {
  const items = schedule.items.map((item) => {
    const mutableItem = { ...item } as Record<string, unknown>;

    if (!mutableItem.default) {
      mutableItem.default =
        mutableItem.start ?? mutableItem.recording ?? mutableItem.finish;
    }

    if (!mutableItem.url) {
      const fallbackUrl =
        getStateImageUrl(mutableItem.default) ??
        getStateImageUrl(mutableItem.start) ??
        getStateImageUrl(mutableItem.recording) ??
        getStateImageUrl(mutableItem.finish);

      if (fallbackUrl) {
        mutableItem.url = fallbackUrl;
      }
    }

    return mutableItem as unknown as typeof item;
  });

  return {
    ...schedule,
    items,
  };
}

export const tauriPlatformApi: PlatformApi = {
  fixClientIds(realClientId) {
    return invoke<number>("fix_client_ids", { realClientId });
  },

  fetchThemes() {
    return invoke<ThemeListItem[]>("fetch_themes");
  },

  fetchSchedules() {
    return invoke<Schedule[]>("fetch_schedules").then((schedules) =>
      schedules.map(normalizeSchedule),
    );
  },

  fetchSchedule(scheduleId) {
    return invoke<Schedule>("fetch_schedule", { scheduleId }).then(
      normalizeSchedule,
    );
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
