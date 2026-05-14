import {
  SUPPORTED_LANGUAGES,
  type LanguageCode,
} from "../contexts/LocalizationContext";
import type { ThemeAvailability } from "../types/Theme";

const THEME_LANGUAGE_PARAM = "lang";

export const THEME_LANGUAGE_NAME_KEYS: Record<LanguageCode, string> = {
  fi: "LanguageFinnish",
  nb: "LanguageNorwegian",
  nn: "LanguageNynorsk",
  se: "LanguageNorthSami",
  sma: "LanguageSouthSami",
  smj: "LanguageLuleSami",
  smn: "LanguageInariSami",
  sms: "LanguageSkoltSami",
  sv: "LanguageSwedish",
};

function hasLanguage(
  theme: ThemeAvailability,
  language: LanguageCode,
): boolean {
  return theme.availableLanguages.includes(language);
}

export function getThemeLanguageDisplayName(
  language: LanguageCode,
  getString: (id: string) => string,
): string {
  return getString(THEME_LANGUAGE_NAME_KEYS[language]);
}

export function getAvailableThemeLanguages(
  themes: ThemeAvailability[],
): LanguageCode[] {
  const availableLanguages = new Set<LanguageCode>();

  for (const themeItem of themes) {
    for (const language of Object.keys(SUPPORTED_LANGUAGES) as LanguageCode[]) {
      if (hasLanguage(themeItem, language)) {
        availableLanguages.add(language);
      }
    }
  }

  return (Object.keys(SUPPORTED_LANGUAGES) as LanguageCode[]).filter(
    (language) => availableLanguages.has(language),
  );
}

export function filterThemesByLanguage(
  themes: ThemeAvailability[],
  language: LanguageCode,
): ThemeAvailability[] {
  return themes.filter((themeItem) => hasLanguage(themeItem, language));
}

export function getThemeLanguageFromSearch(
  search: string,
): LanguageCode | null {
  const params = new URLSearchParams(search);
  const language = params.get(THEME_LANGUAGE_PARAM);

  if (!language || !(language in SUPPORTED_LANGUAGES)) {
    return null;
  }

  return language as LanguageCode;
}

export function getThemesPath(language?: LanguageCode | null): string {
  if (!language) {
    return "/themes";
  }

  return `/themes?${THEME_LANGUAGE_PARAM}=${encodeURIComponent(language)}`;
}
