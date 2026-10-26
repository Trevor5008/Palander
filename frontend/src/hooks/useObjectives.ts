import { useCallback, useEffect, useState } from "react";
import { fetchObjectives } from "../api";
import type { ObjectiveRead } from "../types/api";

type UseObjectivesOptions = {
  domainId?: number;
  status?: string;
};

export function useObjectives(options: UseObjectivesOptions = {}) {
  const { domainId, status } = options;
  const [objectives, setObjectives] = useState<ObjectiveRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchObjectives({
        domain_id: domainId,
        status,
      });
      setObjectives(rows);
    } catch (err) {
      setObjectives([]);
      setError(err instanceof Error ? err.message : "Failed to load objectives");
    } finally {
      setLoading(false);
    }
  }, [domainId, status]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { objectives, loading, error, reload };
}
