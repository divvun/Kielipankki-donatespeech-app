interface ScheduleFinishActionsProps {
  onInviteFriend: () => void;
  onDonateMore: () => void;
  inviteFriendLabel: string;
  donateMoreLabel: string;
}

const baseButtonStyle = {
  padding: "0.75rem 2rem",
  borderRadius: "0.5rem",
  cursor: "pointer",
  fontSize: "1rem",
  fontWeight: "600",
  minWidth: "230px",
};

const primaryButtonStyle = {
  ...baseButtonStyle,
  backgroundColor: "#3B82F6",
  color: "white",
  border: "none",
};

const secondaryButtonStyle = {
  ...baseButtonStyle,
  backgroundColor: "white",
  color: "#3B82F6",
  border: "2px solid #3B82F6",
};

export function ScheduleFinishActions({
  onInviteFriend,
  onDonateMore,
  inviteFriendLabel,
  donateMoreLabel,
}: ScheduleFinishActionsProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-6 flex flex-col items-center space-y-3">
      <button
        type="button"
        onClick={onInviteFriend}
        style={primaryButtonStyle}
      >
        {inviteFriendLabel}
      </button>

      <button
        type="button"
        onClick={onDonateMore}
        style={secondaryButtonStyle}
      >
        {donateMoreLabel}
      </button>
    </div>
  );
}
