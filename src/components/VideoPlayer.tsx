import { type SyntheticEvent, useEffect, useRef, useState } from "react";
import Hls from "hls.js";

interface VideoPlayerProps {
  url: string;
  description?: string;
}

export function VideoPlayer({ url, description }: VideoPlayerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const isHlsStream = /\.m3u8(?:$|[?#])/i.test(url);

  const handleCanPlay = () => {
    setLoading(false);
  };

  const handleError = (e: SyntheticEvent<HTMLVideoElement, Event>) => {
    console.error("Video player error:", e);
    setError("Failed to load video");
    setLoading(false);
  };

  useEffect(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    setLoading(true);
    setError(null);

    if (!isHlsStream) {
      video.src = url;
      return () => {
        video.removeAttribute("src");
        video.load();
      };
    }

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = url;
      return () => {
        video.removeAttribute("src");
        video.load();
      };
    }

    if (!Hls.isSupported()) {
      setError("This browser cannot play HLS video.");
      setLoading(false);
      return;
    }

    const hls = new Hls();

    hls.loadSource(url);
    hls.attachMedia(video);

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      setLoading(false);
    });

    hls.on(Hls.Events.ERROR, (_, data) => {
      if (data.fatal) {
        console.error("HLS player error:", data);
        setError("Failed to load video");
        setLoading(false);
      }
    });

    return () => {
      hls.destroy();
      video.removeAttribute("src");
      video.load();
    };
  }, [isHlsStream, url]);

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
          ref={videoRef}
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
