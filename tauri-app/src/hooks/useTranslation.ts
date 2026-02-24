import { useLocalization as useFluentLocalization } from "@fluent/react";

/**
 * Hook for accessing translations
 * Usage: const { getString } = useTranslation();
 *        const text = getString("ThemesPageTitleText");
 */
export function useTranslation() {
  const { getString } = useFluentLocalization();

  return {
    getString: (id: string, args?: Record<string, unknown>) => {
      return getString(id, args);
    },
  };
}
