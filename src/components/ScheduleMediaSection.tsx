import { AudioPlayer } from "./AudioPlayer";
import { VideoPlayer } from "./VideoPlayer";
import { TextContentView } from "./TextContentView";
import { getItemMediaUrl, type ScheduleItem } from "../types/Schedule";

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
        <div
          className="bg-linear-to-br from-slate-200 via-blue-50 to-slate-300 rounded-lg shadow-md w-full text-center flex flex-col items-center justify-center p-6"
          style={{ aspectRatio: "16 / 9" }}
        >
          <div
            className="media-area mb-4 flex justify-center"
            style={{ color: "var(--primary, #2563eb)" }}
          >
            <svg
              width="32"
              height="32"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Audio/Video/Image
          </h3>
          <p className="text-gray-700">{title}</p>
        </div>
      )}
      {currentItem.itemType === "text-content" && (
        <TextContentView item={currentItem} />
      )}
    </div>
  );
}
