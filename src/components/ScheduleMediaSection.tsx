import { AudioPlayer } from "./AudioPlayer";
import { VideoPlayer } from "./VideoPlayer";
import { TextContentView } from "./TextContentView";
import { getItemMediaUrl, type ScheduleItem } from "../types/Schedule";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { Image } from "lucide-react";

interface ScheduleMediaSectionProps {
  currentItem: ScheduleItem;
  mediaError: string;
  isFakeYleItem: boolean;
  stateImageUrl?: string | null;
  title: string;
  currentMediaUrl: string;
}

export function ScheduleMediaSection({
  currentItem,
  mediaError,
  isFakeYleItem,
  stateImageUrl,
  title,
  currentMediaUrl,
}: ScheduleMediaSectionProps) {
  const hasUrl = Boolean(getItemMediaUrl(currentItem));
  const isVideoItem =
    currentItem.itemType === "video" || currentItem.itemType === "yle-video";
  const isAudioItem =
    currentItem.itemType === "audio" || currentItem.itemType === "yle-audio";
  const showMediaLoader =
    !currentMediaUrl && !mediaError && !isFakeYleItem && hasUrl;

  return (
    <div className="w-full">
      {mediaError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{mediaError}</AlertDescription>
        </Alert>
      )}
      {stateImageUrl ? (
        <div className="w-full aspect-video rounded-2xl overflow-hidden bg-linear-to-br from-secondary to-[#b8d4e8]">
          <img
            src={stateImageUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <>
          {isVideoItem && hasUrl && currentMediaUrl && (
            <VideoPlayer url={currentMediaUrl} description={title} />
          )}
          {isAudioItem && hasUrl && currentMediaUrl && (
            <AudioPlayer url={currentMediaUrl} description={title} />
          )}
          {showMediaLoader && (
            <div className="w-full aspect-video rounded-2xl bg-linear-to-br from-secondary to-[#b8d4e8] flex items-center justify-center">
              <Spinner className="w-8 h-8" />
            </div>
          )}
          {isFakeYleItem && (
            <div className="w-full aspect-video rounded-2xl bg-linear-to-br from-secondary to-[#b8d4e8] flex items-center justify-center">
              <Image className="w-8 h-8 text-primary" />
              <span className="sr-only">{currentItem.itemType}</span>
            </div>
          )}
          {currentItem.itemType === "text-content" && (
            <TextContentView item={currentItem} />
          )}
        </>
      )}{" "}
    </div>
  );
}
