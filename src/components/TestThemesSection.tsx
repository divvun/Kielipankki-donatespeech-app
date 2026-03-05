import type { ThemeListItem } from "../types/Theme";
import { getLocalizedText } from "../utils/localization";

interface TestThemesSectionProps {
  themes: ThemeListItem[];
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

function localizedOrNA(
  value: Record<string, string> | undefined,
  currentLanguage: string,
): string {
  if (!value) {
    return "N/A";
  }

  return getLocalizedText(value, currentLanguage) || "N/A";
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
              {theme.content && (
                <div className="space-y-2 pl-2">
                  <ThemeFieldRow
                    label="Title"
                    value={localizedOrNA(theme.content.title, currentLanguage)}
                  />
                  <ThemeFieldRow
                    label="Body 1"
                    value={localizedOrNA(theme.content.body1, currentLanguage)}
                  />
                  {theme.content.body2 && (
                    <ThemeFieldRow
                      label="Body 2"
                      value={localizedOrNA(
                        theme.content.body2,
                        currentLanguage,
                      )}
                    />
                  )}
                  {theme.content.image && (
                    <ThemeFieldRow label="Image" value={theme.content.image} />
                  )}
                  {theme.content.scheduleIds &&
                    theme.content.scheduleIds.length > 0 && (
                      <ThemeFieldRow
                        label="Schedule IDs"
                        value={theme.content.scheduleIds.join(", ")}
                      />
                    )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
