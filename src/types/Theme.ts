export interface Theme {
  id?: string;
  title: Record<string, string>; // Localized title
  body1: Record<string, string>; // Localized body text 1
  body2: Record<string, string>; // Localized body text 2
  image?: string; // image URL
  scheduleIds: string[];
}

export interface ThemeListItem {
  id: string;
  content: Theme;
}
