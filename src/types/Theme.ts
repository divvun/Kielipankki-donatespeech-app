import type { MediaState, Schedule } from "./Schedule";

export interface ThemeAvailability {
  id: string;
  availableLanguages: string[];
}

export interface Theme {
  id?: string | null;
  mediaState: MediaState;
  schedule?: Schedule | null;
}
