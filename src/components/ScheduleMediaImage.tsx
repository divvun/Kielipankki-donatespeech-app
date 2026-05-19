import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { getMediaUrl } from "../utils/mediaUrl";

interface ScheduleMediaImageProps {
  mediaSource?: string | null;
  alt: string;
  className?: string;
}

export function ScheduleMediaImage({
  mediaSource,
  alt,
  className = "w-full aspect-video rounded-2xl overflow-hidden bg-linear-to-br from-secondary to-[#b8d4e8]",
}: ScheduleMediaImageProps) {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!mediaSource) {
      setResolvedUrl(null);
      setLoading(false);
      return;
    }

    if (/^(blob:|data:)/i.test(mediaSource)) {
      setResolvedUrl(mediaSource);
      setLoading(false);
      return;
    }

    setLoading(true);
    setResolvedUrl(null);

    void getMediaUrl(mediaSource)
      .then((url) => {
        if (!cancelled) {
          setResolvedUrl(url);
        }
      })
      .catch((error) => {
        console.error("Failed to resolve media image:", error);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [mediaSource]);

  if (!mediaSource) {
    return null;
  }

  return (
    <div className={className}>
      {loading && !resolvedUrl ? (
        <div className="w-full h-full flex items-center justify-center">
          <Spinner className="w-8 h-8" />
        </div>
      ) : (
        <img
          src={resolvedUrl ?? mediaSource}
          alt={alt}
          className="w-full h-full object-cover"
        />
      )}
    </div>
  );
}
