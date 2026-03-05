import { useNavigate, useLocation } from "react-router-dom";
import { useTotalRecorded } from "../hooks/useTotalRecorded";
import { getTotalRecordedSeconds } from "../utils/preferences";
import { useTranslation } from "../hooks/useTranslation";
import { Schedule } from "../types/Schedule";
import { getLocalizedText } from "../utils/localization";
import { useLocalization } from "../contexts/LocalizationContext";
import { ScheduleNavigationBar } from "../components/ScheduleNavigationBar";

interface ScheduleFinishLocationState {
  schedule?: Schedule;
  itemsCompleted?: number;
}

export default function ScheduleFinishPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const totalRecorded = useTotalRecorded();
  const { getString } = useTranslation();
  const { currentLanguage } = useLocalization();

  const state = location.state as ScheduleFinishLocationState | undefined;
  const schedule = state?.schedule;

  const handleInviteFriend = async () => {
    const totalSeconds = getTotalRecordedSeconds();
    const minutes = Math.floor(totalSeconds / 60);

    let shareTemplate = getString("InviteFriendTemplate");
    if (minutes < 2) {
      shareTemplate = getString("InviteFriendNewbieTemplate");
    }

    // Format the share text with minutes parameter
    const shareText = shareTemplate.replace("{$param0}", minutes.toString());

    console.log("Share text:", shareText);

    // Use Web Share API if available
    if (navigator.share) {
      try {
        await navigator.share({
          title: getString("InviteFriendTitle"),
          text: shareText,
        });
        console.log("Shared successfully");
      } catch (err) {
        console.log("Share cancelled or failed:", err);
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareText);
        alert("Share text copied to clipboard!");
      } catch (err) {
        console.error("Failed to copy:", err);
        alert("Sharing is not supported on this device");
      }
    }
  };

  const handleDonateMore = () => {
    console.log("Navigating to themes from donate more button");
    navigate("/themes", { replace: true });
  };

  const handleBack = () => {
    console.log("Navigating to themes from back button");
    navigate("/themes", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <ScheduleNavigationBar
        onBack={handleBack}
        donatedLabel={getString("DonatedLabelText")}
        totalRecorded={totalRecorded.totalFormatted}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-32">
        <div className="max-w-2xl w-full">
          {/* Success Image */}
          {schedule?.finish?.imageUrl ? (
            <div className="mb-8 flex justify-center">
              <img
                src={schedule.finish.imageUrl}
                alt=""
                className="max-w-md w-full h-auto rounded-lg shadow-lg"
              />
            </div>
          ) : (
            <div className="mb-8 flex justify-center">
              <div className="w-64 h-64 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center shadow-xl">
                <svg
                  className="w-32 h-32 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          )}

          <h1 className="text-3xl font-bold text-center mb-6 text-gray-900">
            {schedule?.finish?.title
              ? getLocalizedText(schedule.finish.title, currentLanguage)
              : getString("RecordingFinishTitle")}
          </h1>

          <div className="text-center text-gray-700 space-y-4 mb-8">
            {schedule?.finish?.body1 && (
              <p className="text-xl">
                {getLocalizedText(schedule.finish.body1, currentLanguage)}
              </p>
            )}
            {schedule?.finish?.body2 && (
              <p className="text-lg">
                {getLocalizedText(schedule.finish.body2, currentLanguage)}
              </p>
            )}
            <p className="text-lg">
              Total contribution:{" "}
              <strong>{totalRecorded.totalFormatted}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-6 flex flex-col items-center space-y-3">
        <button
          onClick={handleInviteFriend}
          style={{
            backgroundColor: "#3B82F6",
            color: "white",
            padding: "0.75rem 2rem",
            borderRadius: "0.5rem",
            border: "none",
            cursor: "pointer",
            fontSize: "1rem",
            fontWeight: "600",
            minWidth: "230px",
          }}
        >
          {getString("InviteFriendButtonText")}
        </button>

        <button
          onClick={handleDonateMore}
          style={{
            backgroundColor: "white",
            color: "#3B82F6",
            padding: "0.75rem 2rem",
            borderRadius: "0.5rem",
            border: "2px solid #3B82F6",
            cursor: "pointer",
            fontSize: "1rem",
            fontWeight: "600",
            minWidth: "230px",
          }}
        >
          {getString("DonateMoreButtonText")}
        </button>
      </div>
    </div>
  );
}
