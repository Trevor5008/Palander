export type HourSlot = {
  hour: number;
  label: string;
};

export const VISIBLE_HOUR_COUNT = 16;
/** Space reserved above the scroll area (header, toolbar, day name, all-day) */
export const TIMELINE_CHROME_OFFSET_REM = 14;
/** Keep calc divisors in sync with VISIBLE_HOUR_COUNT and TIMELINE_CHROME_OFFSET_REM */
export const HOUR_ROW_HEIGHT_CLASS = "h-[calc((100dvh-14rem)/16)]";
export const TIMELINE_TOP_PADDING_PX = 8;
/** Where the now-line sits in the viewport on load (0 = top, 0.5 = center) */
export const TIMELINE_TIME_ANCHOR_RATIO = 0.25;

/** Scroll container height: exactly VISIBLE_HOUR_COUNT hour rows within the viewport */
export const TIMELINE_VIEWPORT_HEIGHT = "calc(100dvh - 14rem)";

export const HOUR_SLOTS: HourSlot[] = Array.from({ length: 24 }, (_, hour) => {
  const display = hour % 12 || 12;
  const period = hour < 12 ? "am" : "pm";
  return { hour, label: `${display}${period}` };
});

export function getTimeOffsetPx(
  hour: number,
  minute: number,
  rowHeight: number,
  topPadding = TIMELINE_TOP_PADDING_PX,
): number {
  return topPadding + (hour + minute / 60) * rowHeight;
}

export function getAnchoredTimeScrollTop(
  hour: number,
  minute: number,
  rowHeight: number,
  viewportHeight: number,
  maxScrollTop: number,
  topPadding = TIMELINE_TOP_PADDING_PX,
  anchorRatio = TIMELINE_TIME_ANCHOR_RATIO,
): number {
  const target =
    getTimeOffsetPx(hour, minute, rowHeight, topPadding) -
    viewportHeight * anchorRatio;
  return Math.max(0, Math.min(target, maxScrollTop));
}
