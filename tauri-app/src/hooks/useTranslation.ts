import { useLocalization } from "../contexts/LocalizationContext";

/**
 * Hook for accessing translations
 * Usage: const { getString } = useTranslation();
 *        const text = getString("ThemesPageTitleText");
 */
export function useTranslation() {
  const { l10n } = useLocalization();

  return {
    getString: (id: string, args?: Record<string, unknown>) => {
      const message = l10n.getString(id, args);
      // Fluent returns the ID if translation is missing
      return message || id;
    },
  };
}
