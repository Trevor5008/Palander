import { useCallback, useEffect, useState } from "react";
import { fetchEvents, fetchTasks } from "../api";
import type { EventRead, TaskRead } from "../types/api";
import { toApiDateTime } from "../utils/apiMappers";

export function useEntriesRange(start: Date, end: Date) {
  const [events, setEvents] = useState<EventRead[]>([]);
  const [tasks, setTasks] = useState<TaskRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [eventData, taskData] = await Promise.all([
        fetchEvents(toApiDateTime(start), toApiDateTime(end)),
        fetchTasks(toApiDateTime(start), toApiDateTime(end)),
      ]);
      setEvents(eventData);
      setTasks(taskData);
    } catch (err) {
      setEvents([]);
      setTasks([]);
      setError(err instanceof Error ? err.message : "Failed to load entries");
    } finally {
      setLoading(false);
    }
  }, [start, end]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { events, tasks, loading, error, reload };
}
