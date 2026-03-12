import { useNavigate } from "react-router-dom";

function isWebMode(): boolean {
  const mode = import.meta.env.VITE_PLATFORM_MODE?.trim().toLowerCase();
  if (mode === "web") {
    return true;
  }
  // In auto mode, also check if we're NOT in Tauri runtime
  if (mode !== "tauri" && typeof window !== "undefined") {
    const windowRecord = window as unknown as Record<string, unknown>;
    return !Boolean(windowRecord.__TAURI_INTERNALS__ || windowRecord.__TAURI__);
  }
  return false;
}

export function OnboardingResetButton() {
  const navigate = useNavigate();

  // Only show in web mode
  if (!isWebMode()) {
    return null;
  }

  const handleReset = () => {
    localStorage.removeItem("onboardingCompleted");
    navigate("/", { replace: true });
  };

  return (
    <button
      type="button"
      onClick={handleReset}
      className="fixed bottom-4 right-4 px-3 py-2 text-xs bg-gray-400 text-white rounded hover:bg-gray-500 transition-colors z-50 opacity-60 hover:opacity-100"
      title="Reset onboarding and return to start"
    >
      Reset Onboarding
    </button>
  );
}
