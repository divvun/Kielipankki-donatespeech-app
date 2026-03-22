import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../hooks/useTranslation";
import type { ThemeListItem } from "../types/Theme";
import { useTotalRecorded } from "../hooks/useTotalRecorded";
import { useAutoUpload } from "../hooks/useAutoUpload";
import { getLocalizedText } from "../utils/localization";
import { useLocalization } from "../contexts/LocalizationContext";
import { platformApi } from "../platform";
import LanguageSelector from "../components/LanguageSelector";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { Heart, Info, ChevronRight } from "lucide-react";

const BACKEND_EXCEL_BASE_URL =
  "https://raw.githubusercontent.com/divvun/Kielipankki-donatespeech-backend/main/recorder-backend/content/dev/excel";

function isWebMode(): boolean {
  const mode = import.meta.env.VITE_PLATFORM_MODE?.trim().toLowerCase();
  if (mode === "web") {
    return true;
  }

  if (mode !== "tauri" && typeof window !== "undefined") {
    const windowRecord = window as unknown as Record<string, unknown>;
    return !Boolean(windowRecord.__TAURI_INTERNALS__ || windowRecord.__TAURI__);
  }

  return false;
}

function getThemeExcelUrl(themeId: string): string {
  return `${BACKEND_EXCEL_BASE_URL}/${encodeURIComponent(themeId)}.xlsx`;
}

export default function ThemesPage() {
  const [themes, setThemes] = useState<ThemeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();
  const { getString } = useTranslation();
  const totalRecorded = useTotalRecorded();
  const { currentLanguage } = useLocalization();
  const showExcelDownload = isWebMode();

  // Auto-upload pending recordings in the background
  useAutoUpload();

  useEffect(() => {
    loadThemes();
  }, []);

  const loadThemes = async () => {
    console.log("Loading themes...");
    setLoading(true);
    setError("");
    try {
      const result = await platformApi.fetchThemes();
      console.log("Received themes:", result);

      // Filter themes that have scheduleIds
      const filteredThemes = result.filter(
        (themeItem) =>
          themeItem.content?.scheduleIds &&
          themeItem.content.scheduleIds.length > 0,
      );
      setThemes(filteredThemes);
    } catch (err) {
      console.error("Error loading themes:", err);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleThemeClick = (themeItem: ThemeListItem) => {
    // Navigate to the schedule start page
    const firstScheduleId = themeItem.content?.scheduleIds?.[0];
    if (firstScheduleId) {
      console.log("Navigating to schedule start page:", firstScheduleId);
      navigate(`/schedule/${firstScheduleId}/start`);
    }
  };

  const navigateToDetails = () => {
    navigate("/details");
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-white to-background flex flex-col">
      {/* Navigation Bar */}
      <div className="flex items-center justify-between px-5 h-14 shrink-0">
        <LanguageSelector />

        <div className="flex items-center gap-2">
          {/* Donation pill */}
          <div className="pill-base inline-flex items-center gap-1.5 px-3 bg-secondary text-primary">
            <Heart className="w-3.5 h-3.5 fill-primary" />
            {totalRecorded.totalFormatted}
          </div>

          {/* Info button */}
          <button
            onClick={navigateToDetails}
            className="w-9 h-9 rounded-full bg-white border border-border flex items-center justify-center hover:bg-muted transition-colors"
          >
            <Info className="w-4.5 h-4.5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-5 pb-5">
        {/* Header */}
        <div className="mb-5">
          <h1 className="text-[22px] font-extrabold tracking-tight leading-tight text-foreground">
            {getString("ThemesPageTitleText")}
          </h1>
          <p className="text-[13px] text-muted-foreground mt-1.5">
            {getString("ThemesPageBody1Text")}
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-12">
            <Spinner className="w-8 h-8" />
          </div>
        )}

        {/* Error */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>
              {error}
              <Button
                variant="link"
                size="sm"
                onClick={loadThemes}
                className="ml-2 p-0 h-auto"
              >
                {getString("RetryScheduleItem")}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Theme Cards */}
        {!loading && themes.length > 0 && (
          <div className="flex flex-col gap-3">
            {themes.map((themeItem) => {
              const theme = themeItem.content;
              const title = getLocalizedText(theme.title, currentLanguage);
              const excelUrl = getThemeExcelUrl(themeItem.id);

              return (
                <>
                  <button
                    key={themeItem.id}
                    onClick={() => handleThemeClick(themeItem)}
                    className="flex items-center gap-4 p-4 pr-5 bg-white border border-border rounded-2xl cursor-pointer text-left transition-all hover:border-primary hover:shadow-[0_2px_12px_rgba(18,44,107,0.06)]"
                  >
                    {/* Theme Thumbnail */}
                    {themeItem.content?.image ? (
                      <img
                        src={themeItem.content.image}
                        alt={title || "Theme"}
                        className="w-14 h-14 rounded-xl object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl shrink-0 bg-linear-to-br from-secondary to-[#a8c8dd]" />
                    )}

                    {/* Theme Text */}
                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                      <span className="text-base font-semibold text-foreground truncate">
                        {title}
                      </span>
                    </div>

                    {/* Right side: time badge + chevron */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2 py-1 rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">
                        ~5 min
                      </span>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </button>

                  {showExcelDownload && (
                    <a
                      href={excelUrl}
                      download={`${themeItem.id}.xlsx`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-gray-300 px-4 text-sm font-semibold text-white hover:bg-gray-400"
                      title={`Download ${themeItem.id}.xlsx`}
                    >
                      XLSX
                    </a>
                  )}
                </>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && themes.length === 0 && !error && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No themes available</p>
            <Button variant="outline" onClick={loadThemes}>
              {getString("RetryScheduleItem")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
