import type { EventRead } from "../types/api";
import { addDays, startOfDay } from "./date";
import { endOfDay } from "./apiMappers";

export function eventOverlapsDay(event: EventRead, day: Date): boolean {
  const dayStart = startOfDay(day);
  const dayEnd = endOfDay(day);
  const start = new Date(event.start_at);
  const end = new Date(event.end_at);
  return start.getTime() < dayEnd.getTime() && end.getTime() > dayStart.getTime();
}

export function getEventsForDay(events: EventRead[], day: Date): EventRead[] {
  return events.filter((event) => eventOverlapsDay(event, day));
}

export function getTimedSegmentBounds(
  event: EventRead,
  day: Date,
): { segStart: Date; segEnd: Date } | null {
  if (!eventOverlapsDay(event, day)) return null;

  const dayStart = startOfDay(day);
  const dayEndExclusive = addDays(dayStart, 1);
  const start = new Date(event.start_at);
  const end = new Date(event.end_at);

  const segStart = start.getTime() < dayStart.getTime() ? dayStart : start;
  const segEnd =
    end.getTime() > dayEndExclusive.getTime() ? dayEndExclusive : end;

  if (segEnd.getTime() <= segStart.getTime()) return null;

  return { segStart, segEnd };
}
