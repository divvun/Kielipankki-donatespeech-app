export interface Theme {
  id?: string;
  content?: ThemeContent;
}

export interface ThemeContent {
  description?: string;
  image?: string; // image URL
  scheduleIds?: string[];
}
