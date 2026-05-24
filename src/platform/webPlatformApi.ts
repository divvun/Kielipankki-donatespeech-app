import {
  UploadStatus,
  type Recording,
  type Schedule,
  type ScheduleAvailability,
  type Theme,
  type ThemeAvailability,
} from "../types";
import type {
  PlatformApi,
  SaveRecordingCommandResponse,
  SaveRecordingPayload,
} from "./PlatformApi";

const NOT_IMPLEMENTED_ERROR =
  "Web recording pipeline is not implemented yet (planned for Phase 3/4).";
const WEB_MOCK_RECORDINGS_KEY = "webMockRecordings";
const TEST_CLIENT_ID = "test-client-id";

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

function scheduleMatchesId(schedule: Schedule, scheduleId: string): boolean {
  return schedule.id === scheduleId || schedule.scheduleId === scheduleId;
}

function toThemeLanguagePath(themeId: string, lang: string): string {
  return `/v1/theme/${encodeURIComponent(themeId)}?lang=${encodeURIComponent(lang)}`;
}

function isNonNullScheduleAvailability(
  value: ScheduleAvailability | null,
): value is ScheduleAvailability {
  return value !== null;
}

async function resolveThemeSchedule(
  scheduleId: string,
  lang: string,
): Promise<Schedule> {
  const themes = await fetchJson<ThemeAvailability[]>("/v1/theme");
  const themesForLanguage = themes.filter((theme) =>
    theme.availableLanguages.includes(lang),
  );

  const candidates = await Promise.allSettled(
    themesForLanguage.map((theme) =>
      fetchJson<Theme>(toThemeLanguagePath(theme.id, lang)),
    ),
  );

  for (const candidate of candidates) {
    if (candidate.status !== "fulfilled") {
      continue;
    }

    const schedule = candidate.value.schedule;
    if (!schedule) {
      continue;
    }

    if (scheduleMatchesId(schedule, scheduleId)) {
      return schedule;
    }
  }

  throw new Error(
    `Schedule '${scheduleId}' was not found in any theme for language '${lang}'.`,
  );
}

function isYleProgramId(mediaSource: string): boolean {
  return (
    !mediaSource.includes("/") &&
    !mediaSource.includes(".") &&
    mediaSource.includes("-")
  );
}

function toMediaPath(url: string): string {
  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  // Check if this is a YLE program ID
  if (isYleProgramId(url)) {
    return `/v1/yle-media/${url}`;
  }

  if (url.startsWith("/v1/media/")) {
    return url;
  }

  const normalized = url.startsWith("/") ? url.slice(1) : url;
  return `/v1/media/${normalized}`;
}

function loadMockRecordings(): Recording[] {
  if (typeof localStorage === "undefined") {
    return [];
  }

  const rawValue = localStorage.getItem(WEB_MOCK_RECORDINGS_KEY);
  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue);
    return Array.isArray(parsed) ? (parsed as Recording[]) : [];
  } catch {
    return [];
  }
}

function saveMockRecordings(recordings: Recording[]): void {
  if (typeof localStorage === "undefined") {
    return;
  }

  localStorage.setItem(WEB_MOCK_RECORDINGS_KEY, JSON.stringify(recordings));
}

function normalizeDurationSeconds(value: number | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.floor(value));
}

function createMockRecording(
  payload: SaveRecordingPayload,
  durationSeconds: number,
): Recording {
  const now = new Date().toISOString();
  const recordingId = `web-mock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return {
    recordingId,
    itemId: payload.itemId,
    fileName: `${recordingId}.webm`,
    clientId: payload.clientId,
    timestamp: now,
    uploadStatus: UploadStatus.Pending,
    metadata: JSON.stringify({
      recordingDuration: durationSeconds,
      clientId: payload.clientId,
      itemId: payload.itemId,
      recordingTimestamp: now,
      mockRecording: true,
    }),
  };
}

export const webPlatformApi: PlatformApi = {
  async fixClientIds(realClientId) {
    const recordings = loadMockRecordings();
    let updatedCount = 0;

    const updatedRecordings = recordings.map((recording) => {
      if (recording.clientId !== TEST_CLIENT_ID) {
        return recording;
      }

      updatedCount += 1;
      let updatedMetadata = recording.metadata;

      if (updatedMetadata) {
        try {
          const parsedMetadata = JSON.parse(updatedMetadata) as Record<
            string,
            unknown
          >;
          parsedMetadata.clientId = realClientId;
          updatedMetadata = JSON.stringify(parsedMetadata);
        } catch {
          // Keep original metadata if parsing fails.
        }
      }

      return {
        ...recording,
        clientId: realClientId,
        metadata: updatedMetadata,
      };
    });

    if (updatedCount > 0) {
      saveMockRecordings(updatedRecordings);
    }

    return updatedCount;
  },

  fetchThemes() {
    return fetchJson<ThemeAvailability[]>("/v1/theme");
  },

  fetchTheme(themeId, lang) {
    return fetchJson<Theme>(
      `/v1/theme/${encodeURIComponent(themeId)}?lang=${encodeURIComponent(lang)}`,
    );
  },

  async fetchSchedules() {
    const themes = await fetchJson<ThemeAvailability[]>("/v1/theme");

    const resolvedSchedules = await Promise.all(
      themes.map(async (themeAvailability) => {
        const [firstLanguage] = themeAvailability.availableLanguages;
        if (!firstLanguage) {
          return null;
        }

        try {
          const theme = await fetchJson<Theme>(
            toThemeLanguagePath(themeAvailability.id, firstLanguage),
          );
          const schedule = theme.schedule;

          if (!schedule) {
            return null;
          }

          return {
            id: schedule.id ?? schedule.scheduleId ?? themeAvailability.id,
            availableLanguages: themeAvailability.availableLanguages,
          } satisfies ScheduleAvailability;
        } catch {
          return null;
        }
      }),
    );

    return resolvedSchedules.filter(isNonNullScheduleAvailability);
  },

  fetchSchedule(scheduleId, lang) {
    return resolveThemeSchedule(scheduleId, lang);
  },

  async getRecordings() {
    return loadMockRecordings().sort((a, b) =>
      b.timestamp.localeCompare(a.timestamp),
    );
  },

  async insertTestRecording() {
    const testDurationSeconds = 15;
    const mockRecording = createMockRecording(
      {
        itemId: "test-item-id",
        clientId: TEST_CLIENT_ID,
        audioDataBase64: "",
      },
      testDurationSeconds,
    );

    const recordings = loadMockRecordings();
    recordings.unshift(mockRecording);
    saveMockRecordings(recordings);
  },

  async deleteRecording(recordingId) {
    const recordings = loadMockRecordings();
    const filtered = recordings.filter(
      (recording) => recording.recordingId !== recordingId,
    );

    saveMockRecordings(filtered);
  },

  async uploadPendingRecordings() {
    const recordings = loadMockRecordings();
    let uploadedCount = 0;

    const updatedRecordings = recordings.map((recording) => {
      const currentStatus = recording.uploadStatus || UploadStatus.Pending;
      if (currentStatus !== UploadStatus.Pending) {
        return recording;
      }

      uploadedCount += 1;
      return {
        ...recording,
        uploadStatus: UploadStatus.Uploaded,
      };
    });

    if (uploadedCount > 0) {
      saveMockRecordings(updatedRecordings);
      return `Mock upload completed: ${uploadedCount} recording(s).`;
    }

    return "No pending recordings to upload.";
  },

  async getApiBaseUrl() {
    return getConfiguredApiBaseUrl();
  },

  async downloadMedia(url) {
    const mediaPath = toMediaPath(url);
    const fullUrl = toApiUrl(mediaPath);
    const isYle = isYleProgramId(url);

    const response = await fetch(fullUrl);

    if (!response.ok) {
      const responseText = await response.text();
      throw new Error(
        `Media download failed (HTTP ${response.status}): ${responseText || response.statusText}`,
      );
    }

    // For YLE media endpoints, response is JSON with media info
    if (isYle) {
      const jsonText = await response.text();
      console.log(
        `[web] YLE media response (${url}):`,
        jsonText.substring(0, 1000),
      );
      // Return JSON as bytes for consistency with Tauri API
      return Array.from(new TextEncoder().encode(jsonText));
    }

    const buffer = await response.arrayBuffer();
    return Array.from(new Uint8Array(buffer));
  },

  async readFileAsBase64() {
    throw new Error(NOT_IMPLEMENTED_ERROR);
  },

  async saveRecording(
    payload: SaveRecordingPayload,
  ): Promise<SaveRecordingCommandResponse> {
    const durationSeconds = normalizeDurationSeconds(payload.durationSeconds);
    const recording = createMockRecording(payload, durationSeconds);

    const recordings = loadMockRecordings();
    recordings.unshift(recording);
    saveMockRecordings(recordings);

    return {
      recording,
      durationSeconds,
    };
  },

  async deleteFile() {
    // Browser mode has no temp file cleanup yet.
  },
};
