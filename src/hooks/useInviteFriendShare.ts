import { useCallback } from "react";
import { getTotalRecordedSeconds } from "../utils/preferences";

interface UseInviteFriendShareOptions {
  getString: (id: string) => string;
}

function getShareTemplate(getString: (id: string) => string, minutes: number) {
  if (minutes < 2) {
    return getString("InviteFriendNewbieTemplate");
  }

  return getString("InviteFriendTemplate");
}

function buildShareText(template: string, minutes: number) {
  return template.replace("{$param0}", minutes.toString());
}

export function useInviteFriendShare({
  getString,
}: UseInviteFriendShareOptions) {
  const shareWithFriend = useCallback(async () => {
    const totalSeconds = getTotalRecordedSeconds();
    const minutes = Math.floor(totalSeconds / 60);

    const shareTemplate = getShareTemplate(getString, minutes);
    // Replace the Fluent placeholder with recorded minutes.
    const shareText = buildShareText(shareTemplate, minutes);

    console.log("Share text:", shareText);

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: getString("InviteFriendTitle"),
          text: shareText,
        });
        console.log("Shared successfully");
      } catch (err) {
        console.log("Share cancelled or failed:", err);
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(shareText);
      alert("Share text copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy:", err);
      alert("Sharing is not supported on this device");
    }
  }, [getString]);

  return { shareWithFriend };
}
