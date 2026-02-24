import { useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";

/**
 * Hook to automatically upload pending recordings
 *
 * - On mount: uploads pending recordings immediately
 * - Sets up periodic check every 20 seconds (matches C# MAUI behavior)
 *
 * Returns a manual trigger function for uploading after new recordings
 */
export function useAutoUpload() {
  const intervalRef = useRef<number | null>(null);

  const uploadPendingRecordings = async () => {
    try {
      const result = await invoke<string>("upload_pending_recordings");
      console.log("Auto-upload result:", result);
    } catch (err) {
      console.error("Auto-upload failed:", err);
    }
  };

  useEffect(() => {
    // Upload immediately on mount
    uploadPendingRecordings();

    // Set up periodic upload every 20 seconds (matches C# app)
    intervalRef.current = window.setInterval(() => {
      uploadPendingRecordings();
    }, 20000);

    // Cleanup interval on unmount
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    uploadNow: uploadPendingRecordings,
  };
}
