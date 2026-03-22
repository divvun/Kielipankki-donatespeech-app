import { Button } from "./ui/button";
import { ChevronRight } from "lucide-react";
import { Share2 } from "lucide-react";

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
    <div className="fixed bottom-0 left-0 right-0 bg-transparent p-6 flex flex-col items-center space-y-3">
      <Button
        onClick={onDonateMore}
        size="lg"
        className="w-full text-base font-semibold rounded-full py-4 h-auto"
      >
        <span className="inline-flex items-center gap-1.5">
          {donateMoreLabel}
          <ChevronRight className="w-4 h-4" />
        </span>
      </Button>
      <Button
        onClick={onInviteFriend}
        variant="outline"
        size="lg"
        className="w-full text-base font-semibold rounded-full py-4 h-auto"
      >
        <span className="inline-flex items-center gap-1.5">
          {inviteFriendLabel}
          <Share2 className="w-4 h-4" />
        </span>
      </Button>
    </div>
  );
}
