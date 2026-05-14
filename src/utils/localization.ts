/**
 * Resolve UI text from either the new single-language API string shape
 * or the legacy Record<string, string> shape.
 *
 * @param record The localized text record (e.g., {fi: "Suomi", nb: "Norsk"})
 * @param currentLanguage The user's current language preference
 * @param fallbackLanguage The fallback language (default: "nb" - Norwegian Bokmål)
 * @returns The localized text string or empty string if not found
 */
const EMPTY_LOCALIZED_TEXT = "";

function getFirstAvailableValue(record: Record<string, string>): string {
  const values = Object.values(record);
  return values.length > 0 ? values[0] : EMPTY_LOCALIZED_TEXT;
}

export function getLocalizedText(
  record: string | Record<string, string> | null | undefined,
  currentLanguage: string,
  fallbackLanguage = "nb",
): string {
  if (!record) return EMPTY_LOCALIZED_TEXT;

  if (typeof record === "string") {
    return record;
  }

  // Try current language first
  if (record[currentLanguage]) {
    return record[currentLanguage];
  }

  // Try fallback language
  if (record[fallbackLanguage]) {
    return record[fallbackLanguage];
  }

  // Use first available language as last resort
  return getFirstAvailableValue(record);
}
