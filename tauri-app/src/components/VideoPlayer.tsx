import React from "react";

interface VideoPlayerProps {
  url: string;
  description?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  url,
  description,
}) => {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const handleCanPlay = () => {
    setLoading(false);
  };

  const handleError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
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
          maxHeight: "500px",
          objectFit: "contain",
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
};
