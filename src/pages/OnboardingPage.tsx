import { useNavigate } from "react-router-dom";
import LanguageSelector from "../components/LanguageSelector";
import { OnboardingSummary } from "../components/OnboardingSummary";
import { OnboardingActions } from "../components/OnboardingActions";

export default function OnboardingPage() {
  const navigate = useNavigate();

  const handleContinue = () => {
    navigate("/terms");
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-white to-background flex flex-col">
      {/* Language Selector — top left as pill */}
      <div className="flex items-center justify-between px-6 pt-4 pb-2">
        <LanguageSelector />
        <div />
      </div>

      <OnboardingSummary />
      <OnboardingActions onContinue={handleContinue} />
    </div>
  );
}
