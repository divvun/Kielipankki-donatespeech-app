/**
 * Get localized text from a Record<string, string> object
 * Returns text in the current language, falling back to the fallback language,
 * then to the first available language, and finally to an empty string.
 *
 * @param record The localized text record (e.g., {fi: "Suomi", nb: "Norsk"})
 * @param currentLanguage The user's current language preference
 * @param fallbackLanguage The fallback language (default: "nb" - Norwegian Bokmål)
 * @returns The localized text string or empty string if not found
 */
export function getLocalizedText(
  record: Record<string, string> | null | undefined,
  currentLanguage: string,
  fallbackLanguage = "nb",
): string {
  if (!record) return "";

  // Try current language first
  if (record[currentLanguage]) {
    return record[currentLanguage];
  }

  // Try fallback language
  if (record[fallbackLanguage]) {
    return record[fallbackLanguage];
  }

  // Use first available language as last resort
  const values = Object.values(record);
  if (values.length > 0) {
    return values[0];
  }

  return "";
}
