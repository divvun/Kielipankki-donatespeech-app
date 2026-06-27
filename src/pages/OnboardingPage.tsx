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
    <div className="h-dvh bg-linear-to-b from-white to-background flex flex-col">
      {/* Language Selector — top left as pill */}
      <div className="flex items-center justify-between px-6 pb-2 min-h-[calc(44px+var(--inset-top,env(safe-area-inset-top)))] pt-safe shrink-0">
        <LanguageSelector />
        <div />
      </div>

      <div className="flex-1 overflow-auto">
        <OnboardingSummary />
      </div>
      <OnboardingActions onContinue={handleContinue} />
    </div>
  );
}
