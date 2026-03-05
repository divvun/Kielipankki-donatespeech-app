import { useNavigate } from "react-router-dom";
import { useTranslation } from "../hooks/useTranslation";
import LanguageSelector from "../components/LanguageSelector";
import { OnboardingSummary } from "../components/OnboardingSummary";
import { OnboardingActions } from "../components/OnboardingActions";

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { getString } = useTranslation();

  const handleContinue = () => {
    navigate("/terms");
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Language Selector at top */}
      <div className="p-4">
        <LanguageSelector />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-5">
        <div className="max-w-2xl w-full text-center space-y-8">
          <OnboardingSummary
            title={getString("OnboardingTitle")}
            body={getString("OnboardingBody")}
          />

          <OnboardingActions
            continueLabel={getString("ContinueSchedule")}
            onContinue={handleContinue}
          />
        </div>
      </div>
    </div>
  );
}
