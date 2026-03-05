import { useCallback, useEffect, useState } from "react";
import {
  getTotalRecordedSeconds,
  formatTotalRecorded,
} from "../utils/preferences";

function getFormattedTotalRecorded() {
  const seconds = getTotalRecordedSeconds();
  return formatTotalRecorded(seconds);
}

/**
 * Hook to get and display the total recorded time
 * Returns the formatted string and a refresh function
 */
export function useTotalRecorded() {
  const [totalFormatted, setTotalFormatted] = useState<string>(() =>
    getFormattedTotalRecorded(),
  );

  const refresh = useCallback(() => {
    setTotalFormatted(getFormattedTotalRecorded());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    totalFormatted,
    refresh,
  };
}
