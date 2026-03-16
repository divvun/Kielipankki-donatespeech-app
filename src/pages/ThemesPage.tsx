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
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Navigation Bar */}
      <div className="bg-white shadow-sm p-4 flex justify-between items-center">
        {/* Language Selector */}
        <div className="flex-1">
          <LanguageSelector />
        </div>

        {/* Donation Counter */}
        <div className="flex flex-col items-end mr-4">
          <div className="text-xs text-gray-600 uppercase tracking-wide">
            {getString("DonatedLabelText")}
          </div>
          <div className="text-lg font-semibold text-blue-600">
            {totalRecorded.totalFormatted}
          </div>
        </div>

        <button
          onClick={navigateToDetails}
          style={{
            backgroundColor: "#3B82F6",
            color: "white",
            padding: "0.5rem 1.5rem",
            borderRadius: "0.25rem",
            border: "none",
            cursor: "pointer",
            fontSize: "1rem",
          }}
        >
          {getString("DetailsButtonText")}
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-2xl mx-auto px-5 py-9">
          {/* Header */}
          <div className="text-center mb-5">
            <h1 className="text-3xl font-bold mb-3 text-gray-900">
              {getString("ThemesPageBody1Text")}
            </h1>
            <p className="text-base text-gray-600">
              {getString("ThemesPageBody2Text")}
            </p>
          </div>

          {/* Loading Indicator */}
          {loading && (
            <div className="flex justify-center items-center py-5">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-5 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              <strong>Error:</strong> {error}
              <button onClick={loadThemes} className="ml-4 underline">
                Retry
              </button>
            </div>
          )}

          {/* Themes List */}
          {!loading && themes.length > 0 && (
            <div className="space-y-4">
              {themes.map((themeItem) => {
                const theme = themeItem.content;
                const title = getLocalizedText(theme.title, currentLanguage);
                const excelUrl = getThemeExcelUrl(themeItem.id);

                return (
                  <div key={themeItem.id} className="flex items-stretch gap-3">
                    <button
                      onClick={() => handleThemeClick(themeItem)}
                      className="w-full flex-1"
                      style={{
                        backgroundColor: "#3B82F6", // FirstColor
                        borderRadius: "1.5rem",
                        padding: "0.5rem",
                        border: "none",
                        cursor: "pointer",
                        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                        transition: "transform 0.2s, box-shadow 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow =
                          "0 4px 8px rgba(0, 0, 0, 0.15)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow =
                          "0 2px 4px rgba(0, 0, 0, 0.1)";
                      }}
                    >
                      <div className="flex items-center">
                        {/* Theme Image */}
                        {theme.image && (
                          <div
                            style={{
                              borderRadius: "1.125rem",
                              padding: "3px",
                              backgroundColor: "white",
                            }}
                          >
                            <img
                              src={theme.image}
                              alt={title}
                              style={{
                                width: "62px",
                                height: "62px",
                                borderRadius: "1rem",
                                objectFit: "cover",
                              }}
                            />
                          </div>
                        )}

                        {/* Theme Title */}
                        <div className="flex-1 px-4 text-left">
                          <span
                            style={{
                              color: "white",
                              fontSize: "1.125rem",
                              fontWeight: "500",
                              textTransform: "uppercase",
                            }}
                          >
                            {title || "Untitled Theme"}
                          </span>
                        </div>
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
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty State */}
          {!loading && themes.length === 0 && !error && (
            <div className="text-center py-10">
              <p className="text-gray-500 text-lg">No themes available</p>
              <button
                onClick={loadThemes}
                style={{
                  marginTop: "1rem",
                  backgroundColor: "#3B82F6",
                  color: "white",
                  padding: "0.5rem 1.5rem",
                  borderRadius: "0.25rem",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Reload
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
