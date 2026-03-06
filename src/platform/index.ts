import type { PlatformApi } from "./PlatformApi";
import { tauriPlatformApi } from "./tauriPlatformApi";
import { webPlatformApi } from "./webPlatformApi";

type PlatformMode = "auto" | "tauri" | "web";

function resolvePlatformMode(): PlatformMode {
  const rawMode = import.meta.env.VITE_PLATFORM_MODE?.trim().toLowerCase();
  if (rawMode === "tauri" || rawMode === "web") {
    return rawMode;
  }

  return "auto";
}

function isTauriRuntime(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const windowRecord = window as unknown as Record<string, unknown>;
  return Boolean(windowRecord.__TAURI_INTERNALS__ || windowRecord.__TAURI__);
}

function resolvePlatformApi(): PlatformApi {
  const mode = resolvePlatformMode();

  if (mode === "tauri") {
    return tauriPlatformApi;
  }

  if (mode === "web") {
    return webPlatformApi;
  }

  return isTauriRuntime() ? tauriPlatformApi : webPlatformApi;
}

export const platformApi: PlatformApi = resolvePlatformApi();

export type {
  PlatformApi,
  SaveRecordingCommandResponse,
  SaveRecordingPayload,
} from "./PlatformApi";
