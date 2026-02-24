import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useNavigate } from "react-router-dom";
import type { Theme } from "../types/Theme";
import { useTotalRecorded } from "../hooks/useTotalRecorded";
import { useAutoUpload } from "../hooks/useAutoUpload";
import LanguageSelector from "../components/LanguageSelector";

export default function ThemesPage() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();
  const totalRecorded = useTotalRecorded();

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
      const result = await invoke<Theme[]>("fetch_themes");
      console.log("Received themes:", result);

      // Filter themes that have scheduleIds
      const filteredThemes = result.filter(
        (theme) =>
          theme.content?.scheduleIds && theme.content.scheduleIds.length > 0,
      );

      setThemes(filteredThemes);
    } catch (err) {
      console.error("Error loading themes:", err);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleThemeClick = (theme: Theme) => {
    // Navigate to the first schedule in the theme
    const firstScheduleId = theme.content?.scheduleIds?.[0];
    if (firstScheduleId) {
      console.log("Navigating to schedule:", firstScheduleId);
      navigate(`/schedule/${firstScheduleId}`);
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
            YOU HAVE DONATED
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
          Details
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-2xl mx-auto px-5 py-9">
          {/* Header */}
          <div className="text-center mb-5">
            <h1 className="text-3xl font-bold mb-3 text-gray-900">
              Choose a Theme
            </h1>
            <p className="text-base text-gray-600">
              Select a theme to start recording
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
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => handleThemeClick(theme)}
                  className="w-full"
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
                    {theme.content?.image && (
                      <div
                        style={{
                          borderRadius: "1.125rem",
                          padding: "3px",
                          backgroundColor: "white",
                        }}
                      >
                        <img
                          src={theme.content.image}
                          alt={theme.content.description || "Theme"}
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
                        {theme.content?.description || "Untitled Theme"}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
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
