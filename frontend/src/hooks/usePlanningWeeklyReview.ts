import { useCallback, useEffect, useState } from "react";
import { fetchWeeklyReview } from "../api";
import type { WeeklyReviewRead } from "../types/api";

export function usePlanningWeeklyReview(weekStartIso: string) {
  const [data, setData] = useState<WeeklyReviewRead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetchWeeklyReview(weekStartIso));
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : "Failed to load weekly review");
    } finally {
      setLoading(false);
    }
  }, [weekStartIso]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, loading, error, reload };
}
