import { useState, useRef } from "react";
import type { Recording } from "../types/Recording";
import { useWakeLock } from "./useWakeLock";
import { platformApi } from "../platform";

type AudioRecorderModule = typeof import("tauri-plugin-audio-recorder-api");
type TauriPathModule = typeof import("@tauri-apps/api/path");

// Recording time limits
const MAX_RECORDING_SECONDS = 600; // 10 minutes
const WARNING_THRESHOLD_SECONDS = 540; // 9 minutes (1 minute before limit)

export interface SaveRecordingResponse {
  recording: Recording;
  durationSeconds: number;
}

export interface UseRecordingResult {
  isRecording: boolean;
  duration: number;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: (
    itemId: string,
    clientId: string,
  ) => Promise<SaveRecordingResponse | null>;
  resetError: () => void;
  onMaxTimeReached?: () => void;
  onWarningThreshold?: () => void;
}

function getRecordingFormat(extension: string | undefined): string {
  if (extension === "wav") {
    return "WAV (Desktop)";
  }

  if (extension === "m4a") {
    return "M4A (Mobile)";
  }

  return "Unknown";
}

function isTauriRuntime(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const windowRecord = window as unknown as Record<string, unknown>;
  return Boolean(windowRecord.__TAURI_INTERNALS__ || windowRecord.__TAURI__);
}

function isWebRecordingMockEnabled(): boolean {
  const mode = import.meta.env.VITE_PLATFORM_MODE?.trim().toLowerCase();

  if (mode === "tauri") {
    return false;
  }

  if (mode === "web") {
    return true;
  }

  return !isTauriRuntime();
}

export function useRecording(
  onMaxTimeReached?: () => void,
  onWarningThreshold?: () => void,
): UseRecordingResult {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<number | null>(null);
  const durationRef = useRef(0);
  const outputPathRef = useRef<string | null>(null);
  const wakeLock = useWakeLock();
  const warningShownRef = useRef(false);

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const resetSessionDuration = () => {
    setDuration(0);
    durationRef.current = 0;
    warningShownRef.current = false;
  };

  const startDurationTimer = () => {
    stopTimer();
    resetSessionDuration();

    timerRef.current = window.setInterval(() => {
      setDuration((prev) => {
        const newDuration = prev + 1;
        durationRef.current = newDuration;

        if (newDuration >= MAX_RECORDING_SECONDS) {
          onMaxTimeReached?.();
          return newDuration;
        }

        if (
          newDuration >= WARNING_THRESHOLD_SECONDS &&
          !warningShownRef.current
        ) {
          warningShownRef.current = true;
          onWarningThreshold?.();
        }

        return newDuration;
      });
    }, 1000);
  };

  const startRecording = async () => {
    try {
      setError(null);

      if (isWebRecordingMockEnabled()) {
        startDurationTimer();
        setIsRecording(true);
        await wakeLock.requestWakeLock();
        return;
      }

      const audioRecorder: AudioRecorderModule =
        await import("tauri-plugin-audio-recorder-api");
      const pathApi: TauriPathModule = await import("@tauri-apps/api/path");

      // Check and request microphone permission
      const permissionStatus = await audioRecorder.checkPermission();
      if (!permissionStatus.granted) {
        if (permissionStatus.canRequest) {
          const requestResult = await audioRecorder.requestPermission();
          if (!requestResult.granted) {
            throw new Error("Microphone permission denied");
          }
        } else {
          throw new Error(
            "Microphone permission permanently denied. Please enable it in settings.",
          );
        }
      }

      // Generate output path for the recording
      const tempDirPath = await pathApi.tempDir();
      const timestamp = Date.now();
      // Don't specify extension - plugin will use .wav on desktop, .m4a on mobile
      const outputPath = await pathApi.join(
        tempDirPath,
        `recording_${timestamp}`,
      );
      outputPathRef.current = outputPath;

      // Start recording with the plugin
      // Plugin automatically chooses format based on platform:
      // - Desktop: WAV (PCM)
      // - iOS/Android: M4A (AAC)
      await audioRecorder.startRecording({
        outputPath,
        quality: "high",
        maxDuration: 0, // No limit
      });

      startDurationTimer();

      setIsRecording(true);

      // Keep screen on during recording
      await wakeLock.requestWakeLock();
    } catch (err) {
      console.error("Error starting recording:", err);
      setError(
        err instanceof Error ? err.message : "Failed to start recording",
      );
    }
  };

  const stopRecording = async (
    itemId: string,
    clientId: string,
  ): Promise<SaveRecordingResponse | null> => {
    try {
      stopTimer();
      setIsRecording(false);

      // Release wake lock
      await wakeLock.releaseWakeLock();

      if (isWebRecordingMockEnabled()) {
        // Web content-creator mode: persist only duration and metadata.
        return platformApi.saveRecording({
          itemId,
          clientId,
          audioDataBase64: "",
          durationSeconds: durationRef.current,
        });
      }

      const audioRecorder: AudioRecorderModule =
        await import("tauri-plugin-audio-recorder-api");

      // Stop recording using the plugin
      const result = await audioRecorder.stopRecording();

      // Detect the format based on file extension
      const extension = result.filePath.split(".").pop();
      console.log("Recording stopped:", {
        ...result,
        format: getRecordingFormat(extension),
      });

      // Read the audio file and convert to base64
      // Backend will handle format detection and conversion/storage appropriately
      const audioBase64 = await platformApi.readFileAsBase64(result.filePath);

      // Call backend to save recording
      console.log("Saving recording...", {
        itemId,
        clientId,
        dataLength: audioBase64.length,
        filePath: result.filePath,
        duration: result.durationMs / 1000,
      });

      const response = await platformApi.saveRecording({
        itemId,
        clientId,
        audioDataBase64: audioBase64,
      });

      console.log("Recording saved:", response);

      // Clean up the temporary file
      await platformApi.deleteFile(result.filePath);

      outputPathRef.current = null;
      return response;
    } catch (err) {
      console.error("Error saving recording:", err);
      setError(err instanceof Error ? err.message : "Failed to save recording");
      throw err;
    }
  };

  const resetError = () => {
    setError(null);
  };

  return {
    isRecording,
    duration,
    error,
    startRecording,
    stopRecording,
    resetError,
  };
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
