import { useState, useEffect } from "react";
import {
  getTotalRecordedSeconds,
  formatTotalRecorded,
} from "../utils/preferences";

/**
 * Hook to get and display the total recorded time
 * Returns the formatted string and a refresh function
 */
export function useTotalRecorded() {
  const [totalFormatted, setTotalFormatted] = useState<string>("");

  const refresh = () => {
    const seconds = getTotalRecordedSeconds();
    setTotalFormatted(formatTotalRecorded(seconds));
  };

  useEffect(() => {
    refresh();
  }, []);

  return {
    totalFormatted,
    refresh,
  };
}
