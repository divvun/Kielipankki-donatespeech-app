import { useEffect, useState } from "react";
import type { Schedule } from "../types/Schedule";
import { platformApi } from "../platform";

interface UseScheduleOptions {
  scheduleId?: string;
  language: string;
  noItemsError: string;
}

interface UseScheduleResult {
  schedule: Schedule | null;
  loading: boolean;
  error: string;
}

export function useSchedule({
  scheduleId,
  language,
  noItemsError,
}: UseScheduleOptions): UseScheduleResult {
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    const loadSchedule = async () => {
      if (!scheduleId) {
        if (!cancelled) {
          setSchedule(null);
          setError("");
          setLoading(false);
        }
        return;
      }

      if (!cancelled) {
        setLoading(true);
        setError("");
      }

      try {
        const result = await platformApi.fetchSchedule(scheduleId, language);

        if (cancelled) {
          return;
        }

        if (!result.items || result.items.length === 0) {
          setSchedule(null);
          setError(noItemsError);
          return;
        }

        setSchedule(result);
      } catch (err) {
        if (cancelled) {
          return;
        }

        setSchedule(null);
        setError(String(err));
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadSchedule();

    return () => {
      cancelled = true;
    };
  }, [scheduleId, language, noItemsError]);

  return { schedule, loading, error };
}
