import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronRight, Heart, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import LanguageSelector from "../components/LanguageSelector";
import type { LanguageCode } from "../contexts/LocalizationContext";
import { useAutoUpload } from "../hooks/useAutoUpload";
import { useTotalRecorded } from "../hooks/useTotalRecorded";
import { useTranslation } from "../hooks/useTranslation";
import { platformApi } from "../platform";
import { getStateMediaUrl } from "../types/Schedule";
import type { Theme, ThemeAvailability } from "../types/Theme";
import {
  getAvailableThemeLanguages,
  getThemeLanguageDisplayName,
  getThemeLanguageFromSearch,
  getThemesPath,
} from "../utils/themeLanguage";

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
  const [themeAvailabilities, setThemeAvailabilities] = useState<
    ThemeAvailability[]
  >([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const location = useLocation();
  const navigate = useNavigate();
  const { getString } = useTranslation();
  const totalRecorded = useTotalRecorded();
  const showExcelDownload = isWebMode();
  const themeLanguage = getThemeLanguageFromSearch(location.search);
  const availableThemeLanguages = useMemo(
    () => getAvailableThemeLanguages(themeAvailabilities),
    [themeAvailabilities],
  );
  const displayedThemes = useMemo(
    () =>
      themes.filter(
        (theme) => theme.schedule?.id || theme.schedule?.scheduleId,
      ),
    [themes],
  );

  // Auto-upload pending recordings in the background
  useAutoUpload();

  useEffect(() => {
    loadThemeAvailabilities();
  }, []);

  useEffect(() => {
    if (!themeLanguage) {
      setThemes([]);
      return;
    }

    if (themeAvailabilities.length === 0) {
      return;
    }

    loadThemesForLanguage(themeLanguage);
  }, [themeAvailabilities, themeLanguage]);

  const loadThemeAvailabilities = async () => {
    console.log("Loading theme availabilities...");
    setLoading(true);
    setError("");
    try {
      const result = await platformApi.fetchThemes();
      console.log("Received theme availabilities:", result);
      setThemeAvailabilities(result);
    } catch (err) {
      console.error("Error loading themes:", err);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const loadThemesForLanguage = async (language: LanguageCode) => {
    console.log("Loading themes for language:", language);
    setLoading(true);
    setError("");
    try {
      const availableThemes = themeAvailabilities.filter((theme) =>
        theme.availableLanguages.includes(language),
      );
      const result = await Promise.all(
        availableThemes.map((theme) =>
          platformApi.fetchTheme(theme.id, language),
        ),
      );
      setThemes(result);
    } catch (err) {
      console.error("Error loading localized themes:", err);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleThemeClick = (theme: Theme) => {
    const scheduleId = theme.schedule?.id ?? theme.schedule?.scheduleId;
    if (scheduleId) {
      console.log("Navigating to schedule start page:", scheduleId);
      navigate(`/schedule/${scheduleId}/start${location.search}`);
    }
  };

  const navigateToDetails = () => {
    navigate(`/details${location.search}`);
  };

  const handleLanguageSelect = (language: LanguageCode) => {
    navigate(getThemesPath(language));
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
            {themeLanguage
              ? getString("ThemesPageTitleText")
              : getString("ChooseLanguageTitle")}
          </h1>
          {themeLanguage ? (
            <p className="text-[13px] text-muted-foreground mt-1.5">
              {getString("ThemesPageBody1Text")}
            </p>
          ) : null}
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
                onClick={() =>
                  themeLanguage
                    ? loadThemesForLanguage(themeLanguage)
                    : loadThemeAvailabilities()
                }
                className="ml-2 p-0 h-auto"
              >
                {getString("RetryScheduleItem")}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Language buttons */}
        {!loading && !themeLanguage && availableThemeLanguages.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {availableThemeLanguages.map((language) => (
              <Button
                key={language}
                variant="outline"
                size="lg"
                onClick={() => handleLanguageSelect(language)}
                className="h-auto justify-between rounded-2xl px-4 py-5 text-left"
              >
                <span className="flex flex-col items-start gap-1">
                  <span className="text-base font-semibold">
                    {getThemeLanguageDisplayName(language, getString)}
                  </span>
                  <span className="text-xs font-medium text-muted-foreground">
                    {language.toUpperCase()}
                  </span>
                </span>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </Button>
            ))}
          </div>
        )}

        {/* Theme Cards */}
        {!loading && themeLanguage && displayedThemes.length > 0 && (
          <div className="flex flex-col gap-3">
            {displayedThemes.map((theme) => {
              const themeId =
                theme.id ?? theme.schedule?.id ?? theme.schedule?.scheduleId;
              const title = theme.mediaState.title;
              const imageUrl = getStateMediaUrl(theme.mediaState);
              const excelUrl = getThemeExcelUrl(themeId || "theme");
              const scheduleItemCount = theme.schedule?.items.length || 0;

              return (
                <div key={themeId || title} className="flex flex-col gap-2">
                  <button
                    onClick={() => handleThemeClick(theme)}
                    className="flex items-center gap-4 p-4 pr-5 bg-white border border-border rounded-2xl cursor-pointer text-left transition-all hover:border-primary hover:shadow-[0_2px_12px_rgba(18,44,107,0.06)]"
                  >
                    {/* Theme Thumbnail */}
                    {imageUrl ? (
                      <img
                        src={imageUrl}
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
                        {scheduleItemCount} items
                      </span>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </button>

                  {showExcelDownload && themeId && (
                    <a
                      href={excelUrl}
                      download={`${themeId}.xlsx`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-gray-300 px-4 text-sm font-semibold text-white hover:bg-gray-400"
                      title={`Download ${themeId}.xlsx`}
                    >
                      XLSX
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Empty state when no themes exist for the chosen language */}
        {!loading &&
          themeLanguage &&
          displayedThemes.length === 0 &&
          !error && (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No themes available</p>
              <Button variant="outline" onClick={() => navigate("/themes")}>
                {getString("ChooseLanguageTitle")}
              </Button>
            </div>
          )}

        {/* Empty State */}
        {!loading &&
          !themeLanguage &&
          themeAvailabilities.length === 0 &&
          !error && (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No themes available</p>
              <Button variant="outline" onClick={loadThemeAvailabilities}>
                {getString("RetryScheduleItem")}
              </Button>
            </div>
          )}
      </div>
    </div>
  );
}
