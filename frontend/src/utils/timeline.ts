import type { EventRead } from "../types/api";
import {
  getAnchoredTimeScrollTop,
  getTimeOffsetPx,
  TIMELINE_TOP_PADDING_PX,
} from "../constants/time";
import { getTimedSegmentBounds } from "./eventSegments";

export function measureRowHeight(container: HTMLDivElement): number {
  return container.querySelector<HTMLElement>("[data-hour]")?.offsetHeight ?? 40;
}

export function scrollTimelineToTime(
  container: HTMLDivElement,
  hour: number,
  minute: number,
) {
  const rowHeight = measureRowHeight(container);
  const maxScrollTop = container.scrollHeight - container.clientHeight;
  container.scrollTop = getAnchoredTimeScrollTop(
    hour,
    minute,
    rowHeight,
    container.clientHeight,
    maxScrollTop,
  );
}

export function getEventBlockStyle(
  event: EventRead,
  rowHeight: number,
  clipDay?: Date,
): { top: number; height: number } | null {
  const bounds = clipDay ? getTimedSegmentBounds(event, clipDay) : null;
  const start = bounds?.segStart ?? new Date(event.start_at);
  const end = bounds?.segEnd ?? new Date(event.end_at);

  if (clipDay && !bounds) {
    return null;
  }

  const top = getTimeOffsetPx(start.getHours(), start.getMinutes(), rowHeight);
  const durationMs = Math.max(end.getTime() - start.getTime(), 15 * 60 * 1000);
  const height = (durationMs / (1000 * 60 * 60)) * rowHeight;
  return { top, height: Math.max(height, rowHeight * 0.35) };
}

export { getTimeOffsetPx, TIMELINE_TOP_PADDING_PX };
