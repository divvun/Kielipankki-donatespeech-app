import { useTranslation } from "../hooks/useTranslation";

interface OnboardingActionsProps {
  onContinue: () => void;
}

const continueButtonClassName =
  "bg-blue-500 text-white px-12 py-3 rounded hover:bg-blue-600 font-semibold text-lg";

export function OnboardingActions({
  onContinue,
}: OnboardingActionsProps) {
    const { getString } = useTranslation();
  
  return (
    <button
      type="button"
      onClick={onContinue}
      className={continueButtonClassName}
    >
      {getString("ContinueSchedule")}
    </button>
  );
}
