import { useState, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import * as audioRecorder from "tauri-plugin-audio-recorder-api";
import { tempDir, join } from "@tauri-apps/api/path";
import type { Recording } from "../types/Recording";
import { useWakeLock } from "./useWakeLock";

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

export function useRecording(
  onMaxTimeReached?: () => void,
  onWarningThreshold?: () => void,
): UseRecordingResult {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<number | null>(null);
  const outputPathRef = useRef<string | null>(null);
  const wakeLock = useWakeLock();
  const warningShownRef = useRef(false);

  const startRecording = async () => {
    try {
      setError(null);

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
      const tempDirPath = await tempDir();
      const timestamp = Date.now();
      // Don't specify extension - plugin will use .wav on desktop, .m4a on mobile
      const outputPath = await join(tempDirPath, `recording_${timestamp}`);
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

      // Start duration timer
      setDuration(0);
      warningShownRef.current = false;
      timerRef.current = window.setInterval(() => {
        setDuration((prev) => {
          const newDuration = prev + 1;

          // Check if max recording time reached
          if (newDuration >= MAX_RECORDING_SECONDS) {
            // Auto-stop recording when limit is reached
            onMaxTimeReached?.();
            return newDuration;
          }

          // Check if warning threshold reached (only show once)
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
      const audioBase64 = await invoke<string>("read_file_as_base64", {
        filePath: result.filePath,
      });

      // Call backend to save recording
      console.log("Saving recording...", {
        itemId,
        clientId,
        dataLength: audioBase64.length,
        filePath: result.filePath,
        duration: result.durationMs / 1000,
      });

      const response = await invoke<SaveRecordingResponse>("save_recording", {
        itemId,
        clientId,
        audioDataBase64: audioBase64,
      });

      console.log("Recording saved:", response);

      // Clean up the temporary file
      await invoke("delete_file", {
        filePath: result.filePath,
      });

      outputPathRef.current = null;
      return response;
    } catch (err) {
      console.error("Error saving recording:", err);
      setError(err instanceof Error ? err.message : "Failed to save recording");
      throw err;
    }
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
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
