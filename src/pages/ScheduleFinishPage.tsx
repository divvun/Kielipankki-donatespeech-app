import { useNavigate, useLocation } from "react-router-dom";
import { useTotalRecorded } from "../hooks/useTotalRecorded";
import { getTotalRecordedSeconds } from "../utils/preferences";
import { useTranslation } from "../hooks/useTranslation";
import { Schedule } from "../types/Schedule";
import { getLocalizedText } from "../utils/localization";
import { useLocalization } from "../contexts/LocalizationContext";
import { ScheduleNavigationBar } from "../components/ScheduleNavigationBar";
import { ScheduleFinishSummary } from "../components/ScheduleFinishSummary";
import { ScheduleFinishActions } from "../components/ScheduleFinishActions";

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

  const finishTitle = schedule?.finish?.title
    ? getLocalizedText(schedule.finish.title, currentLanguage)
    : getString("RecordingFinishTitle");
  const finishBody1 = schedule?.finish?.body1
    ? getLocalizedText(schedule.finish.body1, currentLanguage)
    : "";
  const finishBody2 = schedule?.finish?.body2
    ? getLocalizedText(schedule.finish.body2, currentLanguage)
    : "";

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <ScheduleNavigationBar
        onBack={handleBack}
        donatedLabel={getString("DonatedLabelText")}
        totalRecorded={totalRecorded.totalFormatted}
      />

      <ScheduleFinishSummary
        finishImageUrl={schedule?.finish?.imageUrl}
        title={finishTitle}
        body1={finishBody1}
        body2={finishBody2}
        totalRecorded={totalRecorded.totalFormatted}
      />

      <ScheduleFinishActions
        onInviteFriend={handleInviteFriend}
        onDonateMore={handleDonateMore}
        inviteFriendLabel={getString("InviteFriendButtonText")}
        donateMoreLabel={getString("DonateMoreButtonText")}
      />
    </div>
  );
}
