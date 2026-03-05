import { type SyntheticEvent, useState } from "react";

interface VideoPlayerProps {
  url: string;
  description?: string;
}

const videoStyle = {
  maxHeight: "500px",
  objectFit: "contain" as const,
};

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
    <div className="bg-gray-100 rounded-lg shadow-md p-4">
      {description && (
        <p className="text-gray-700 text-center mb-4">{description}</p>
      )}
      {loading && !error && (
        <div className="text-center text-gray-500 mb-2 py-8">
          Loading video...
        </div>
      )}
      {error && (
        <div className="text-center text-red-500 mb-2 py-8">{error}</div>
      )}
      <video
        controls
        className="w-full rounded-lg"
        style={{
          ...videoStyle,
          display: loading ? "none" : "block",
        }}
        onCanPlay={handleCanPlay}
        onError={handleError}
      >
        <source src={url} />
        Your browser does not support the video element.
      </video>
    </div>
  );
}
