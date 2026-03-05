import type { ThemeListItem } from "../types/Theme";
import { getLocalizedText } from "../utils/localization";

interface TestThemesSectionProps {
  themes: ThemeListItem[];
  currentLanguage: string;
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
      <h2 className="text-xl font-semibold mb-4">Found {themes.length} theme(s)</h2>
      <div className="space-y-4">
        {themes.map((theme) => (
          <div key={theme.id} className="bg-white p-4 rounded shadow">
            <div className="text-sm">
              <div className="mb-2">
                <span className="font-semibold">Theme ID:</span> {theme.id || "N/A"}
              </div>
              {theme.content && (
                <div className="space-y-2">
                  <div>
                    <span className="font-semibold">Title:</span>{" "}
                    {getLocalizedText(theme.content.title, currentLanguage) ||
                      "N/A"}
                  </div>
                  <div>
                    <span className="font-semibold">Body 1:</span>{" "}
                    {getLocalizedText(theme.content.body1, currentLanguage) ||
                      "N/A"}
                  </div>
                  {theme.content.body2 && (
                    <div>
                      <span className="font-semibold">Body 2:</span>{" "}
                      {getLocalizedText(theme.content.body2, currentLanguage) ||
                        "N/A"}
                    </div>
                  )}
                  {theme.content.image && (
                    <div>
                      <span className="font-semibold">Image:</span>{" "}
                      {theme.content.image}
                    </div>
                  )}
                  {theme.content.scheduleIds &&
                    theme.content.scheduleIds.length > 0 && (
                      <div>
                        <span className="font-semibold">Schedule IDs:</span>{" "}
                        {theme.content.scheduleIds.join(", ")}
                      </div>
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
