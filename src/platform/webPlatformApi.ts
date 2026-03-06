import type { Schedule, ThemeListItem } from "../types";
import type {
  PlatformApi,
  SaveRecordingCommandResponse,
  SaveRecordingPayload,
} from "./PlatformApi";

const NOT_IMPLEMENTED_ERROR =
  "Web recording pipeline is not implemented yet (planned for Phase 3/4).";

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function getConfiguredApiBaseUrl(): string {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
  if (configuredBaseUrl) {
    return trimTrailingSlash(configuredBaseUrl);
  }

  if (typeof window !== "undefined") {
    return trimTrailingSlash(window.location.origin);
  }

  throw new Error(
    "Unable to resolve API base URL in web mode. Set VITE_API_BASE_URL.",
  );
}

function toApiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getConfiguredApiBaseUrl()}${normalizedPath}`;
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(toApiUrl(path));

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(
      `HTTP ${response.status} for ${path}: ${responseText || response.statusText}`,
    );
  }

  return (await response.json()) as T;
}

function toMediaPath(url: string): string {
  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  if (url.startsWith("/v1/media/")) {
    return url;
  }

  const normalized = url.startsWith("/") ? url.slice(1) : url;
  return `/v1/media/${normalized}`;
}

export const webPlatformApi: PlatformApi = {
  async fixClientIds() {
    // No local DB migration yet in web mode.
    return 0;
  },

  fetchThemes() {
    return fetchJson<ThemeListItem[]>("/v1/theme");
  },

  fetchSchedules() {
    return fetchJson<Schedule[]>("/v1/schedule");
  },

  fetchSchedule(scheduleId) {
    return fetchJson<Schedule>(
      `/v1/schedule/${encodeURIComponent(scheduleId)}`,
    );
  },

  async getRecordings() {
    return [];
  },

  async insertTestRecording() {
    // Test insert path is Tauri-only until IndexedDB storage is added.
  },

  async deleteRecording() {
    // No-op until web local recording store exists.
  },

  async uploadPendingRecordings() {
    return "Web upload queue not implemented yet.";
  },

  async getApiBaseUrl() {
    return getConfiguredApiBaseUrl();
  },

  async downloadMedia(url) {
    const response = await fetch(toApiUrl(toMediaPath(url)));

    if (!response.ok) {
      const responseText = await response.text();
      throw new Error(
        `Media download failed (HTTP ${response.status}): ${responseText || response.statusText}`,
      );
    }

    const buffer = await response.arrayBuffer();
    return Array.from(new Uint8Array(buffer));
  },

  async readFileAsBase64() {
    throw new Error(NOT_IMPLEMENTED_ERROR);
  },

  async saveRecording(
    _payload: SaveRecordingPayload,
  ): Promise<SaveRecordingCommandResponse> {
    throw new Error(NOT_IMPLEMENTED_ERROR);
  },

  async deleteFile() {
    // Browser mode has no temp file cleanup yet.
  },
};
