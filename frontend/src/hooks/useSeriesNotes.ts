import { useEffect, useState } from "react";
import { fetchEventSeriesNotes } from "../api";
import type { SeriesNoteStackItem } from "../types/api";

export function useSeriesNotes(
  eventId: number,
  occurrenceStartAt: string,
  enabled: boolean,
) {
  const [items, setItems] = useState<SeriesNoteStackItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setItems([]);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    void fetchEventSeriesNotes(eventId, occurrenceStartAt)
      .then((response) => {
        if (!cancelled) {
          setItems(response.items);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load series history");
          setItems([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [eventId, occurrenceStartAt, enabled]);

  return { items, loading, error };
}
