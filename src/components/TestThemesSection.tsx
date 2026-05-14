import type { ThemeAvailability } from "../types/Theme";
import { getLocalizedText } from "../utils/localization";

interface TestThemesSectionProps {
  themes: ThemeAvailability[];
  currentLanguage: string;
}

interface ThemeFieldRowProps {
  label: string;
  value: string;
}

function ThemeFieldRow({ label, value }: ThemeFieldRowProps) {
  return (
    <div>
      <span className="font-semibold">{label}:</span> {value}
    </div>
  );
}

function valueOrNA(value?: string): string {
  return value || "N/A";
}

function availableLanguagesOrNA(
  value: string[] | undefined,
  currentLanguage: string,
): string {
  if (!value || value.length === 0) {
    return getLocalizedText("N/A", currentLanguage) || "N/A";
  }

  return value.join(", ");
}

export function TestThemesSection({
  themes,
  currentLanguage,
}: TestThemesSectionProps) {
  if (themes.length === 0) {
    return null;
  }

  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold mb-4">
        Found {themes.length} theme(s)
      </h2>
      <div className="space-y-4">
        {themes.map((theme) => (
          <div key={theme.id} className="bg-white p-4 rounded shadow">
            <div className="text-sm space-y-2">
              <ThemeFieldRow label="Theme ID" value={valueOrNA(theme.id)} />
              <ThemeFieldRow
                label="Available languages"
                value={availableLanguagesOrNA(
                  theme.availableLanguages,
                  currentLanguage,
                )}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
