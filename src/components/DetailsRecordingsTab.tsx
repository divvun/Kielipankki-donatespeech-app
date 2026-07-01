import { CloudCheck, CloudOff, Trash2 } from "lucide-react";
import type { Recording } from "../types";
import { useTranslation } from "../hooks/useTranslation";
import { formatTotalRecorded } from "../utils/preferences";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";

export interface RecordingWithDuration extends Recording {
  duration?: number;
}

interface DetailsRecordingsTabProps {
  activeClientId: string;
  loading: boolean;
  error: string;
  recordings: RecordingWithDuration[];
  deletingId: string | null;
  onDelete: (recording: RecordingWithDuration) => void;
}

function formatDuration(seconds?: number): string {
  if (seconds === undefined) return "Unknown";
  if (seconds < 1) return "<1 sec";
  if (seconds < 60) return `${Math.floor(seconds)} sec`;
  return formatTotalRecorded(seconds);
}

function formatTimestamp(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    return date.toLocaleString();
  } catch {
    return timestamp;
  }
}

export function DetailsRecordingsTab({
  activeClientId,
  loading,
  error,
  recordings,
  deletingId,
  onDelete,
}: DetailsRecordingsTabProps) {
  const { getString } = useTranslation();
  const filteredRecordings = recordings.filter(
    (recording) => recording.clientId === activeClientId,
  );

  return (
    <div className="flex-1 overflow-auto px-5 py-3">
      {loading && (
        <div className="flex justify-center py-12">
          <Spinner className="w-8 h-8" />
        </div>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {!loading && !error && filteredRecordings.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No recordings yet.
        </div>
      )}

      {!loading && !error && filteredRecordings.length > 0 && (
        <div className="flex flex-col gap-2">
          {filteredRecordings.map((recording) =>
            renderRecordingItem(recording, onDelete, deletingId, getString),
          )}
        </div>
      )}
    </div>
  );
}

function renderRecordingItem(
  recording: RecordingWithDuration,
  onDelete: (recording: RecordingWithDuration) => void,
  deletingId: string | null,
  getString: (id: string) => string,
): import("react/jsx-runtime").JSX.Element {
  return (
    <div
      key={recording.recordingId}
      className="flex items-center justify-between p-3.5 px-4 bg-white border border-border rounded-xl"
    >
      <div className="flex flex-col gap-1 flex-1 min-w-0">
        <span className="text-base text-foreground truncate">
          {recording.fileName || "Unknown"}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-muted-foreground">
            {formatDuration(recording.duration)}
          </span>
          <div className="w-0.75 h-0.75 rounded-full bg-muted-foreground" />
          <span className="text-[13px] text-muted-foreground">
            {formatTimestamp(recording.timestamp)}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2.5 shrink-0">
        {recording.uploadStatus?.toLowerCase() === "uploaded" ? (
          <span
            className="inline-flex items-center gap-1.5 rounded-full bg-muted/30 px-2 py-1 text-muted-foreground"
            aria-label={getString("RecordingUploadStatusUploaded")}
            title={getString("RecordingUploadStatusUploaded")}
          >
            <CloudCheck className="w-4.5 h-4.5" />
            <span className="text-[11px] font-semibold">
              {getString("RecordingUploadStatusUploaded")}
            </span>
          </span>
        ) : (
          <span
            className="inline-flex items-center gap-1.5 rounded-full bg-muted/30 px-2 py-1 text-muted-foreground"
            aria-label={getString("RecordingUploadStatusNotUploaded")}
            title={getString("RecordingUploadStatusNotUploaded")}
          >
            <CloudOff className="w-4.5 h-4.5" />
            <span className="text-[11px] font-semibold">
              {getString("RecordingUploadStatusNotUploaded")}
            </span>
          </span>
        )}
        <button
          type="button"
          aria-label="Delete recording"
          onClick={() => onDelete(recording)}
          disabled={deletingId === recording.recordingId}
          className="bg-transparent border-none p-1 cursor-pointer text-muted-foreground hover:text-destructive transition-colors"
        >
          {deletingId === recording.recordingId ? (
            <Spinner className="w-4.5 h-4.5" />
          ) : (
            <Trash2 className="w-4.5 h-4.5" />
          )}
        </button>
      </div>
    </div>
  );
}
