import React from "react";

interface AudioPlayerProps {
  url: string;
  description?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  url,
  description,
}) => {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const handleCanPlay = () => {
    setLoading(false);
  };

  const handleError = (e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
    console.error("Audio player error:", e);
    setError("Failed to load audio");
    setLoading(false);
  };

  return (
    <div className="bg-gray-100 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-center mb-4">
        <span className="text-2xl mr-2">🔊</span>
        <h3 className="text-lg font-semibold text-gray-800">Audio Player</h3>
      </div>
      {description && (
        <p className="text-gray-700 text-center mb-4">{description}</p>
      )}
      {loading && !error && (
        <div className="text-center text-gray-500 mb-2">Loading audio...</div>
      )}
      {error && <div className="text-center text-red-500 mb-2">{error}</div>}
      <audio
        controls
        className="w-full"
        style={{
          outline: "none",
          maxWidth: "100%",
        }}
        onCanPlay={handleCanPlay}
        onError={handleError}
      >
        <source src={url} />
        Your browser does not support the audio element.
      </audio>
    </div>
  );
};
