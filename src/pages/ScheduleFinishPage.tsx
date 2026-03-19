import { useNavigate, useLocation } from "react-router-dom";
import { useTotalRecorded } from "../hooks/useTotalRecorded";
import { useTranslation } from "../hooks/useTranslation";
import { useInviteFriendShare } from "../hooks/useInviteFriendShare";
import { getStateMediaUrl, type ScheduleState } from "../types/Schedule";
import { getLocalizedText } from "../utils/localization";
import { useLocalization } from "../contexts/LocalizationContext";
import { ScheduleNavigationBar } from "../components/ScheduleNavigationBar";
import { ScheduleFinishSummary } from "../components/ScheduleFinishSummary";
import { ScheduleFinishActions } from "../components/ScheduleFinishActions";

interface ScheduleFinishLocationState {
  finish?: ScheduleState | null;
  itemsCompleted?: number;
}

export default function ScheduleFinishPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const totalRecorded = useTotalRecorded();
  const { getString } = useTranslation();
  const { shareWithFriend } = useInviteFriendShare({ getString });
  const { currentLanguage } = useLocalization();

  const state = location.state as ScheduleFinishLocationState | undefined;
  const finish = state?.finish;

  const handleDonateMore = () => {
    console.log("Navigating to themes from donate more button");
    navigate("/themes", { replace: true });
  };

  const handleBack = () => {
    console.log("Navigating to themes from back button");
    navigate("/themes", { replace: true });
  };

  const finishTitle = finish?.title
    ? getLocalizedText(finish.title, currentLanguage)
    : getString("RecordingFinishTitle");
  const finishBody1 = finish?.body1
    ? getLocalizedText(finish.body1, currentLanguage)
    : "";
  const finishBody2 = finish?.body2
    ? getLocalizedText(finish.body2, currentLanguage)
    : "";

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <ScheduleNavigationBar
        onBack={handleBack}
        totalRecorded={totalRecorded.totalFormatted}
      />

      <ScheduleFinishSummary
        finishImageUrl={getStateMediaUrl(finish)}
        title={finishTitle}
        body1={finishBody1}
        body2={finishBody2}
        totalRecorded={totalRecorded.totalFormatted}
      />

      <ScheduleFinishActions
        onInviteFriend={shareWithFriend}
        onDonateMore={handleDonateMore}
        inviteFriendLabel={getString("InviteFriendButtonText")}
        donateMoreLabel={getString("DonateMoreButtonText")}
      />
    </div>
  );
}
