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

export function getThemeId(theme: Theme): string | null {
  return theme.id ?? theme.schedule?.id ?? theme.schedule?.scheduleId ?? null;
}

export function getThemeScheduleId(theme: Theme): string | null {
  return theme.schedule?.id ?? theme.schedule?.scheduleId ?? null;
}
