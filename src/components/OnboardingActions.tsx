interface OnboardingActionsProps {
  continueLabel: string;
  onContinue: () => void;
}

const continueButtonClassName =
  "bg-blue-500 text-white px-12 py-3 rounded hover:bg-blue-600 font-semibold text-lg";

export function OnboardingActions({
  continueLabel,
  onContinue,
}: OnboardingActionsProps) {
  return (
    <button
      type="button"
      onClick={onContinue}
      className={continueButtonClassName}
    >
      {continueLabel}
    </button>
  );
}
