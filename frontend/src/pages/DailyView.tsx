import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { useLayoutEffect, useRef, useState } from "react";
import { CurrentTimeIndicator } from "../components/CurrentTimeIndicator";
import {
  getAnchoredTimeScrollTop,
  HOUR_ROW_HEIGHT_CLASS,
  HOUR_SLOTS,
  TIMELINE_TOP_PADDING_PX,
  TIMELINE_VIEWPORT_HEIGHT,
} from "../constants/time";
import { useCurrentTime } from "../hooks/useCurrentTime";
import { EventModal } from "../modals/EventModal";
import { addDays, formatDate, formatDayName, isSameDay, startOfDay } from "../utils/date";

function measureRowHeight(container: HTMLDivElement): number {
  return container.querySelector<HTMLElement>("[data-hour]")?.offsetHeight ?? 40;
}

function scrollTimelineToTime(
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

export function DailyView() {
  const now = useCurrentTime();
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(now));
  const [rowHeight, setRowHeight] = useState(40);
  const [showAddModal, setShowAddModal] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isToday = isSameDay(selectedDate, now);

  useLayoutEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    setRowHeight(measureRowHeight(container));

    if (isToday) {
      scrollTimelineToTime(container, now.getHours(), now.getMinutes());
      return;
    }

    container.scrollTop = 0;
  }, [selectedDate, isToday]);

  return (
    <section className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div className="grid grid-cols-3 items-center border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Previous day"
            onClick={() => setSelectedDate((date) => addDays(date, -1))}
            className="rounded p-1.5 text-gray-600 hover:bg-gray-100"
          >
            <ChevronLeftIcon className="size-5" />
          </button>
          <button
            type="button"
            aria-label="Next day"
            onClick={() => setSelectedDate((date) => addDays(date, 1))}
            className="rounded p-1.5 text-gray-600 hover:bg-gray-100"
          >
            <ChevronRightIcon className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => setSelectedDate(startOfDay(new Date()))}
            className="ml-1 rounded border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50"
          >
            today
          </button>
        </div>

        <h2 className="text-center text-lg font-semibold">{formatDate(selectedDate)}</h2>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="rounded border border-gray-300 p-1.5 text-sm text-gray-600 hover:bg-gray-100"
          >
            add +
          </button>
        </div>
      </div>

      <div className="border-b border-gray-200 py-2 text-center text-md text-gray-900">
        {formatDayName(selectedDate)}
      </div>

      <div
        ref={scrollRef}
        className="relative overflow-y-auto"
        style={{ height: TIMELINE_VIEWPORT_HEIGHT }}
      >
        <div
          className="relative"
          style={{ paddingTop: TIMELINE_TOP_PADDING_PX }}
        >
          {isToday && (
            <CurrentTimeIndicator
              hour={now.getHours()}
              minute={now.getMinutes()}
              rowHeight={rowHeight}
            />
          )}

          {HOUR_SLOTS.map(({ hour, label }) => (
            <div
              key={hour}
              data-hour={hour}
              className={`relative flex ${HOUR_ROW_HEIGHT_CLASS}`}
            >
              <div className="relative w-16 shrink-0">
                <span
                  className={`absolute right-2 text-xs text-gray-400 ${
                    hour === 0 ? "top-0" : "-top-2"
                  }`}
                >
                  {label}
                </span>
              </div>
              <div className="flex-1 border-t border-gray-200" />
            </div>
          ))}
        </div>
      </div>

      <EventModal
        showAddEventModal={showAddModal}
        onClose={() => setShowAddModal(false)}
        defaultDate={selectedDate}
      />
    </section>
  );
}
