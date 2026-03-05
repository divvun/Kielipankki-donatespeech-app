import { useRef, useEffect } from "react";

function isWakeLockSupported() {
  return "wakeLock" in navigator;
}

/**
 * Hook to keep the screen awake during recording
 * Uses the Wake Lock API when available
 */
export function useWakeLock() {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const requestWakeLock = async () => {
    try {
      // Check if Wake Lock API is supported
      if (isWakeLockSupported()) {
        wakeLockRef.current = await navigator.wakeLock.request("screen");
        console.log("Wake lock acquired - screen will stay on");

        // Release wake lock on visibility change (e.g., tab hidden)
        wakeLockRef.current.addEventListener("release", () => {
          console.log("Wake lock released");
        });
      } else {
        console.warn("Wake Lock API not supported on this device");
      }
    } catch (err) {
      console.error("Failed to acquire wake lock:", err);
    }
  };

  const releaseWakeLock = async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        console.log("Wake lock released manually");
      } catch (err) {
        console.error("Failed to release wake lock:", err);
      }
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
      }
    };
  }, []);

  return {
    requestWakeLock,
    releaseWakeLock,
    isSupported: isWakeLockSupported(),
  };
}
