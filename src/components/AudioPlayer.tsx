import { type SyntheticEvent, useState } from "react";

interface AudioPlayerProps {
  url: string;
  description?: string;
}

const playerContainerClassName = "bg-gray-100 rounded-lg shadow-md p-6";
const audioStyle = {
  outline: "none",
  maxWidth: "100%",
};

export function AudioPlayer({ url, description }: AudioPlayerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleCanPlay = () => {
    setLoading(false);
  };

  const handleError = (e: SyntheticEvent<HTMLAudioElement, Event>) => {
    console.error("Audio player error:", e);
    setError("Failed to load audio");
    setLoading(false);
  };

  return (
    <div className={playerContainerClassName}>
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
        style={audioStyle}
        onCanPlay={handleCanPlay}
        onError={handleError}
      >
        <source src={url} />
        Your browser does not support the audio element.
      </audio>
    </div>
  );
}
