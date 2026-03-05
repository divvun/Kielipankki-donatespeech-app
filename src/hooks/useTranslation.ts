import { useLocalization } from "../contexts/LocalizationContext";
import type { FluentVariable } from "@fluent/bundle";

/**
 * Hook for accessing translations
 * Usage: const { getString } = useTranslation();
 *        const text = getString("ThemesPageTitleText");
 */
export function useTranslation() {
  const { l10n } = useLocalization();

  const getString = (
    id: string,
    args?: Record<string, FluentVariable> | null,
  ) => {
    const message = l10n.getString(id, args);
    // Fluent returns the ID if translation is missing
    return message || id;
  };

  return {
    getString,
  };
}
