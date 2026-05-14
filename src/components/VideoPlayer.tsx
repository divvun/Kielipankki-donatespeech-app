import { type SyntheticEvent, useState } from "react";

interface VideoPlayerProps {
  url: string;
  description?: string;
}

export function VideoPlayer({ url, description }: VideoPlayerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleCanPlay = () => {
    setLoading(false);
  };

  const handleError = (e: SyntheticEvent<HTMLVideoElement, Event>) => {
    console.error("Video player error:", e);
    setError("Failed to load video");
    setLoading(false);
  };

  return (
    <div className="w-full">
      <div className="w-full aspect-video rounded-2xl bg-gray-100 overflow-hidden shadow-md flex flex-col">
        {description && (
          <p className="text-gray-700 text-center p-4 text-sm">{description}</p>
        )}
        {loading && !error && (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Loading video...
          </div>
        )}
        {error && (
          <div className="flex-1 flex items-center justify-center text-red-500">
            {error}
          </div>
        )}
        <video
          controls
          className={`flex-1 w-full rounded-lg ${loading && !error ? "hidden" : "block"}`}
          onCanPlay={handleCanPlay}
          onError={handleError}
        >
          <source src={url} />
          Your browser does not support the video element.
        </video>
      </div>
    </div>
  );
}
