import { getTimeOffsetPx } from "../constants/time";

type CurrentTimeIndicatorProps = {
  hour: number;
  minute: number;
  rowHeight: number;
  /** full: daily view with time-gutter arrow; column: single day column in week view */
  variant?: "full" | "column";
};

export function CurrentTimeIndicator({
  hour,
  minute,
  rowHeight,
  variant = "full",
}: CurrentTimeIndicatorProps) {
  const top = getTimeOffsetPx(hour, minute, rowHeight);

  if (variant === "column") {
    return (
      <div
        className="pointer-events-none absolute inset-x-0 z-20 flex items-center px-0.5"
        style={{ top }}
      >
        <div className="size-2 shrink-0 rounded-full bg-red-500" aria-hidden />
        <div className="h-0.5 flex-1 bg-red-500" />
      </div>
    );
  }

  return (
    <div
      className="pointer-events-none absolute inset-x-0 z-10 flex items-center"
      style={{ top }}
    >
      <div className="flex w-16 shrink-0 items-center pl-1">
        <div
          className="size-0 border-y-[5px] border-y-transparent border-l-[6px] border-l-red-500"
          aria-hidden
        />
      </div>
      <div className="h-0.5 flex-1 bg-red-500" />
    </div>
  );
}
