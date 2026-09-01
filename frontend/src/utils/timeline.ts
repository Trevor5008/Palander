import type { EventRead } from "../types/api";
import {
  getAnchoredTimeScrollTop,
  getTimeOffsetPx,
  TIMELINE_TOP_PADDING_PX,
} from "../constants/time";

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

export function getEventBlockStyle(event: EventRead, rowHeight: number) {
  const start = new Date(event.start_at);
  const end = new Date(event.end_at);
  const top = getTimeOffsetPx(start.getHours(), start.getMinutes(), rowHeight);
  const durationMs = Math.max(end.getTime() - start.getTime(), 15 * 60 * 1000);
  const height = (durationMs / (1000 * 60 * 60)) * rowHeight;
  return { top, height: Math.max(height, rowHeight * 0.35) };
}

export { getTimeOffsetPx, TIMELINE_TOP_PADDING_PX };
