interface OnboardingActionsProps {
  continueLabel: string;
  onContinue: () => void;
}

export function OnboardingActions({
  continueLabel,
  onContinue,
}: OnboardingActionsProps) {
  return (
    <button
      onClick={onContinue}
      className="bg-blue-500 text-white px-12 py-3 rounded hover:bg-blue-600 font-semibold text-lg"
    >
      {continueLabel}
    </button>
  );
}
