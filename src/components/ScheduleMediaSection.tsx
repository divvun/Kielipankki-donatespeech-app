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
  getString: (id: string) => string;
}

export function ScheduleMediaSection({
  currentItem,
  mediaError,
  isFakeYleItem,
  stateImageUrl,
  title,
  currentMediaUrl,
  getString,
}: ScheduleMediaSectionProps) {
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
      {(currentItem.itemType === "video" ||
        currentItem.itemType === "yle-video") &&
        "url" in currentItem &&
        currentMediaUrl && (
          <VideoPlayer url={currentMediaUrl} description={title} />
        )}
      {(currentItem.itemType === "audio" ||
        currentItem.itemType === "yle-audio") &&
        "url" in currentItem &&
        currentMediaUrl && (
          <AudioPlayer url={currentMediaUrl} description={title} />
        )}
      {!currentMediaUrl &&
        !mediaError &&
        !isFakeYleItem &&
        "url" in currentItem &&
        currentItem.url && (
          <div className="bg-gray-200 rounded-lg shadow-md p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Loading media...</p>
          </div>
        )}
      {isFakeYleItem && (
        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg shadow-md p-8 text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {getString("YleContentUnavailable") || "YLE Content Unavailable"}
          </h3>
          <p className="text-gray-700">
            {getString("YleContentUnavailableMessage") ||
              "This content requires YLE API credentials to be configured."}
          </p>
        </div>
      )}
      {currentItem.itemType === "text-content" && "url" in currentItem && (
        <TextContentView item={currentItem} />
      )}
    </div>
  );
}
