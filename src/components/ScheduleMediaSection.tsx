import { AudioPlayer } from "./AudioPlayer";
import { VideoPlayer } from "./VideoPlayer";
import { TextContentView } from "./TextContentView";
import type { ScheduleItem } from "../types/Schedule";

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
  const hasUrl = "url" in currentItem && Boolean(currentItem.url);
  const isVideoItem =
    currentItem.itemType === "video" || currentItem.itemType === "yle-video";
  const isAudioItem =
    currentItem.itemType === "audio" || currentItem.itemType === "yle-audio";
  const showMediaLoader =
    !currentMediaUrl && !mediaError && !isFakeYleItem && hasUrl;

  return (
    <div className="mb-6">
      {mediaError && !isFakeYleItem && (
        <div className="bg-red-100 border border-red-400 text-red-700 rounded-lg p-4 mb-4">
          <strong>Media Error:</strong> {mediaError}
        </div>
      )}
      {stateImageUrl && (
        <img
          src={stateImageUrl}
          alt={title}
          className="w-full rounded-lg shadow-md mb-4"
          style={{ maxHeight: "300px", objectFit: "cover" }}
        />
      )}
      {isVideoItem && hasUrl && currentMediaUrl && (
        <VideoPlayer url={currentMediaUrl} description={title} />
      )}
      {isAudioItem && hasUrl && currentMediaUrl && (
        <AudioPlayer url={currentMediaUrl} description={title} />
      )}
      {showMediaLoader && (
        <div className="bg-gray-200 rounded-lg shadow-md p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading media...</p>
        </div>
      )}
      {isFakeYleItem && (
        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg shadow-md p-8 text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-700">{currentItem.itemType}</p>
        </div>
      )}
      {currentItem.itemType === "text-content" && "url" in currentItem && (
        <TextContentView item={currentItem} />
      )}
    </div>
  );
}
