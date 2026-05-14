import { useLocation, useParams, useNavigate } from "react-router-dom";
import { getStateMediaUrl } from "../types/Schedule";
import { useTranslation } from "../hooks/useTranslation";
import { useSchedule } from "../hooks/useSchedule";
import { useTotalRecorded } from "../hooks/useTotalRecorded";
import { getLocalizedText } from "../utils/localization";
import { useLocalization } from "../contexts/LocalizationContext";
import { ScheduleNavigationBar } from "../components/ScheduleNavigationBar";
import { ScheduleStartSummary } from "../components/ScheduleStartSummary";
import { ScheduleStartActions } from "../components/ScheduleStartActions";
import { ScheduleLoadingState } from "../components/ScheduleLoadingState";
import { ScheduleErrorState } from "../components/ScheduleErrorState";
import {
  appendSearch,
  getThemeLanguageFromSearch,
  getThemesPathFromSearch,
} from "../utils/themeLanguage";

export default function ScheduleStartPage() {
  const { scheduleId } = useParams<{ scheduleId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { getString } = useTranslation();
  const totalRecorded = useTotalRecorded();
  const { currentLanguage } = useLocalization();
  const requestedLanguage = getThemeLanguageFromSearch(location.search);
  const scheduleLanguage = requestedLanguage ?? currentLanguage;

  const { schedule, loading, error } = useSchedule({
    scheduleId,
    language: scheduleLanguage,
    noItemsError: getString("SchedulePageNoItemsError"),
  });

  const handleStart = () => {
    if (!schedule || !scheduleId) return;

    // Navigate to the schedule page to begin
    navigate(appendSearch(`/schedule/${scheduleId}`, location.search));
  };

  const handleBack = () => {
    navigate(getThemesPathFromSearch(location.search));
  };

  const startTitle = schedule?.start?.title
    ? getLocalizedText(schedule.start.title, currentLanguage)
    : "Ready to begin";
  const startBody1 = schedule?.start?.body1
    ? getLocalizedText(schedule.start.body1, currentLanguage)
    : "";
  const startBody2 = schedule?.start?.body2
    ? getLocalizedText(schedule.start.body2, currentLanguage)
    : "";

  if (loading) {
    return <ScheduleLoadingState />;
  }

  if (error) {
    return (
      <ScheduleErrorState
        error={error}
        onBack={handleBack}
        backLabel="Back to Themes"
      />
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-white to-background flex flex-col">
      <ScheduleNavigationBar
        onBack={handleBack}
        totalRecorded={totalRecorded.totalFormatted}
      />

      <ScheduleStartSummary
        startImageUrl={getStateMediaUrl(schedule?.start)}
        title={startTitle}
        body1={startBody1}
        body2={startBody2}
      />

      <ScheduleStartActions
        onStart={handleStart}
        startLabel={getString("StartButtonText")}
      />
    </div>
  );
}
