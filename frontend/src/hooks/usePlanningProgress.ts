import { useCallback, useEffect, useState } from "react";
import { fetchPlanningProgress } from "../api";
import type { PlanningProgressRead } from "../types/api";

export function usePlanningProgress(weeks = 8) {
  const [data, setData] = useState<PlanningProgressRead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetchPlanningProgress(weeks));
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : "Failed to load progress");
    } finally {
      setLoading(false);
    }
  }, [weeks]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, loading, error, reload };
}
