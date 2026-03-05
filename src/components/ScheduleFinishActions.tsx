interface ScheduleFinishActionsProps {
  onInviteFriend: () => void;
  onDonateMore: () => void;
  inviteFriendLabel: string;
  donateMoreLabel: string;
}

export function ScheduleFinishActions({
  onInviteFriend,
  onDonateMore,
  inviteFriendLabel,
  donateMoreLabel,
}: ScheduleFinishActionsProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-6 flex flex-col items-center space-y-3">
      <button
        onClick={onInviteFriend}
        style={{
          backgroundColor: "#3B82F6",
          color: "white",
          padding: "0.75rem 2rem",
          borderRadius: "0.5rem",
          border: "none",
          cursor: "pointer",
          fontSize: "1rem",
          fontWeight: "600",
          minWidth: "230px",
        }}
      >
        {inviteFriendLabel}
      </button>

      <button
        onClick={onDonateMore}
        style={{
          backgroundColor: "white",
          color: "#3B82F6",
          padding: "0.75rem 2rem",
          borderRadius: "0.5rem",
          border: "2px solid #3B82F6",
          cursor: "pointer",
          fontSize: "1rem",
          fontWeight: "600",
          minWidth: "230px",
        }}
      >
        {donateMoreLabel}
      </button>
    </div>
  );
}
