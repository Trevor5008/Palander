import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { CurrentTimeIndicator } from "./CurrentTimeIndicator";
import { WEEKDAY_LABELS } from "../constants/calendar";
import { getDomainClassesById } from "../constants/domainColors";
import {
  HOUR_ROW_HEIGHT_CLASS,
  HOUR_SLOTS,
  TIMELINE_TOP_PADDING_PX,
  TIMELINE_VIEWPORT_HEIGHT,
} from "../constants/time";
import { useCurrentTime } from "../hooks/useCurrentTime";
import type { DomainRead, EventRead, TaskRead } from "../types/api";
import { isSameApiDay, partitionEvents } from "../utils/apiMappers";
import { getEventsForDay } from "../utils/eventSegments";
import { eventOccurrenceKey } from "../utils/recurrence";
import { addDays, formatShortMonthDay, isSameDay } from "../utils/date";
import {
  getEventBlockStyle,
  getTimeOffsetPx,
  measureRowHeight,
  scrollTimelineToTime,
} from "../utils/timeline";

// Props for the week timeline component
type WeekTimelineProps = {
  weekStart: Date;
  events: EventRead[];
  tasks: TaskRead[];
  domains: DomainRead[];
  onEditEvent: (event: EventRead) => void;
  onEditTask: (task: TaskRead) => void;
};

// Week timeline component
export function WeekTimeline({
  weekStart,
  events,
  tasks,
  domains,
  onEditEvent,
  onEditTask,
}: WeekTimelineProps) {
  const now = useCurrentTime();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [rowHeight, setRowHeight] = useState(40);

  // Calculate the days of the week
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  // Check if today is in the week
  const todayInWeek = days.some((day) => isSameDay(day, now));

  // Scroll to the current time when the component mounts
  useLayoutEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    setRowHeight(measureRowHeight(container));

    if (todayInWeek) {
      scrollTimelineToTime(container, now.getHours(), now.getMinutes());
      return;
    }

    container.scrollTop = 0;
  }, [weekStart, todayInWeek, now.getHours(), now.getMinutes()]);

  // Check if there are any all-day events
  const hasAllDayEvents = days.some((day) => {
    const dayEvents = getEventsForDay(events, day);
    return partitionEvents(dayEvents).allDay.length > 0;
  });

  // Render the week timeline
  return (
    <>
      {/* Day column headers */}
      <div className="flex border-b border-gray-200">
        <div className="w-16 shrink-0" />
        <div className="grid flex-1 grid-cols-7">
          {/* Render the day headers */}
          {days.map((day, index) => {
            const isToday = isSameDay(day, now);
            return (
              <div
                key={day.toISOString()}
                className={`border-l border-gray-200 py-2 text-center first:border-l-0 ${
                  isToday ? "bg-blue-50" : ""
                }`}
              >
                <div className="text-xs font-medium text-gray-500">{WEEKDAY_LABELS[index]}</div>
                <div
                  className={`text-sm ${isToday ? "font-semibold text-blue-700" : "text-gray-900"}`}
                >
                  {formatShortMonthDay(day)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* All-day events per column */}
      {hasAllDayEvents && (
        <div className="flex border-b border-gray-200">
          <div className="flex w-16 shrink-0 items-start justify-end px-1 pt-2 text-[10px] text-gray-400">
            all-day
          </div>
          <div className="grid flex-1 grid-cols-7">
            {/* Render the all-day events */}
            {days.map((day) => {
              const dayEvents = getEventsForDay(events, day);
              const { allDay } = partitionEvents(dayEvents);
              return (
                <div
                  key={day.toISOString()}
                  className="min-h-8 space-y-0.5 border-l border-gray-200 p-1 first:border-l-0"
                >
                  {/* Render the all-day event chips */}
                  {allDay.map((event) => {
                    const colors = getDomainClassesById(event.domain_id, domains);
                    return (
                      <button
                        key={eventOccurrenceKey(event)}
                        type="button"
                        onClick={() => onEditEvent(event)}
                        className={`block w-full truncate rounded px-1 py-0.5 text-left text-[10px] ${colors.chip}`}
                      >
                        {event.title}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Timed grid: time gutter + 7 day columns */}
      <div
        ref={scrollRef}
        className="relative overflow-y-auto"
        style={{ height: TIMELINE_VIEWPORT_HEIGHT }}
      >
        <div className="relative flex" style={{ paddingTop: TIMELINE_TOP_PADDING_PX }}>
          <div className="w-16 shrink-0">
            {/* Render the hour labels */}
            {HOUR_SLOTS.map(({ hour, label }) => (
              <div key={hour} data-hour={hour} className={`relative ${HOUR_ROW_HEIGHT_CLASS}`}>
                <span
                  className={`absolute right-2 text-xs text-gray-400 ${
                    hour === 0 ? "top-0" : "-top-2"
                  }`}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>

          <div className="relative min-w-0 flex-1">
            {/* Render the hour dividers */}
            {HOUR_SLOTS.map(({ hour }) => (
              <div
                key={hour}
                data-hour={hour}
                className={`relative ${HOUR_ROW_HEIGHT_CLASS}`}
              >
                <div className="absolute inset-x-0 top-0 border-t border-gray-200" />
              </div>
            ))}

            <div className="absolute inset-0 grid grid-cols-7">
              {/* Render the day columns */}
              {days.map((day) => {
                const isToday = isSameDay(day, now);
                const dayEvents = getEventsForDay(events, day);
                const { timed } = partitionEvents(dayEvents);
                const dayTasks = tasks.filter((t) => isSameApiDay(t.due_date, day));

                // Render a day column for each day in the week
                return (
                  <div
                    key={day.toISOString()}
                    className="relative border-l border-blue-200 first:border-l-0"
                  >
                    {/* Render the current time indicator on current day*/}
                    {isToday && (
                      <CurrentTimeIndicator
                        variant="column"
                        hour={now.getHours()}
                        minute={now.getMinutes()}
                        rowHeight={rowHeight}
                      />
                    )}

                    {/* Render the timed events */}
                    {timed.map((event) => {
                      const blockStyle = getEventBlockStyle(event, rowHeight, day);
                      if (!blockStyle) return null;
                      const { top, height } = blockStyle;
                      const colors = getDomainClassesById(event.domain_id, domains);
                      return (
                        <button
                          key={`${eventOccurrenceKey(event)}-${day.toISOString()}`}
                          type="button"
                          onClick={() => onEditEvent(event)}
                          className={`absolute left-0.5 right-0.5 z-10 overflow-hidden rounded border px-1 py-0.5 text-left text-[10px] ${colors.block}`}
                          style={{ top, height }}
                        >
                          <span className="line-clamp-3 font-medium">{event.title}</span>
                        </button>
                      );
                    })}

                    {/* Render the tasks */}
                    {dayTasks.map((task) => {
                      // Calculate the top position of the task
                      const due = new Date(task.due_date);
                      const top = getTimeOffsetPx(
                        due.getHours(),
                        due.getMinutes(),
                        rowHeight,
                      );
                      const colors = getDomainClassesById(task.domain_id, domains);
                      return (
                        <button
                          key={task.id}
                          type="button"
                          onClick={() => onEditTask(task)}
                          className={`absolute left-0.5 right-0.5 z-10 truncate rounded px-1 py-0.5 text-left text-[10px] ${colors.chip}`}
                          style={{ top, height: rowHeight * 0.35 }}
                        >
                          {task.name}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Tasks with due times shown as chips below header area could go in columns - skip for now unless tasks have times */}
    </>
  );
}
