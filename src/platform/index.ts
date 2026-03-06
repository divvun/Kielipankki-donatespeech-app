import type { PlatformApi } from "./PlatformApi";
import { tauriPlatformApi } from "./tauriPlatformApi";

export const platformApi: PlatformApi = tauriPlatformApi;

export type {
  PlatformApi,
  SaveRecordingCommandResponse,
  SaveRecordingPayload,
} from "./PlatformApi";
