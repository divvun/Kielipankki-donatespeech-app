import { type SyntheticEvent, useState } from "react";

interface AudioPlayerProps {
  url: string;
  description?: string;
}

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
    <div className="w-full">
      <div className="w-full aspect-video rounded-2xl bg-gray-100 shadow-md p-6 flex flex-col items-center justify-center">
        {description && (
          <p className="text-gray-700 text-center mb-4 text-sm">
            {description}
          </p>
        )}
        {loading && !error && (
          <div className="text-center text-gray-500">Loading audio...</div>
        )}
        {error && <div className="text-center text-red-500">{error}</div>}
        {!loading && !error && (
          <div className="w-full flex flex-col items-center gap-4">
            <div className="flex items-center justify-center">
              <span className="text-3xl mr-2">🔊</span>
            </div>
            <audio
              controls
              className="w-full max-w-xs"
              onCanPlay={handleCanPlay}
              onError={handleError}
            >
              <source src={url} />
              Your browser does not support the audio element.
            </audio>
          </div>
        )}
      </div>
    </div>
  );
}
