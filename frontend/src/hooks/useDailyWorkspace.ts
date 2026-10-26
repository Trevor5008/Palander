import { useCallback, useEffect, useState } from "react";
import { fetchDailyWorkspace } from "../api";
import type { DailyWorkspaceRead } from "../types/api";

export function useDailyWorkspace(dateIso: string) {
  const [data, setData] = useState<DailyWorkspaceRead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const workspace = await fetchDailyWorkspace(dateIso);
      setData(workspace);
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : "Failed to load daily workspace");
    } finally {
      setLoading(false);
    }
  }, [dateIso]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, loading, error, reload };
}
