import { useEffect, useState } from "react";

export function useCurrentTime(updateIntervalMs = 60_000) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), updateIntervalMs);
    return () => window.clearInterval(id);
  }, [updateIntervalMs]);

  return now;
}
