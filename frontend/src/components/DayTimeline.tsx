import { PencilSquareIcon } from "@heroicons/react/24/outline";
import { useLayoutEffect, useRef, useState } from "react";
import { CurrentTimeIndicator } from "./CurrentTimeIndicator";
import { getDomainClassesById } from "../constants/domainColors";
import {
  HOUR_ROW_HEIGHT_CLASS,
  HOUR_SLOTS,
  TIMELINE_TOP_PADDING_PX,
  TIMELINE_VIEWPORT_HEIGHT,
} from "../constants/time";
import { useCurrentTime } from "../hooks/useCurrentTime";
import type { DomainRead, EventRead, TaskRead } from "../types/api";
import { isSamePlannedDay, partitionEvents } from "../utils/apiMappers";
import { getEventsForDay } from "../utils/eventSegments";
import { formatDayName, isSameDay } from "../utils/date";
import { eventOccurrenceKey } from "../utils/recurrence";
import {
  getEventBlockStyle,
  measureRowHeight,
  scrollTimelineToTime,
} from "../utils/timeline";

type DayTimelineProps = {
  selectedDate: Date;
  events: EventRead[];
  tasks: TaskRead[];
  domains: DomainRead[];
  objectivesById: Map<number, string>;
  onEditEvent: (event: EventRead) => void;
  onEditTask: (task: TaskRead) => void;
  showDayName?: boolean;
};

export function DayTimeline({
  selectedDate,
  events,
  tasks,
  domains,
  objectivesById,
  onEditEvent,
  onEditTask,
  showDayName = true,
}: DayTimelineProps) {
  const now = useCurrentTime();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [rowHeight, setRowHeight] = useState(40);
  const isToday = isSameDay(selectedDate, now);

  const dayEvents = getEventsForDay(events, selectedDate);
  const { timed } = partitionEvents(dayEvents);
  const dayTasks = tasks.filter((t) => isSamePlannedDay(t.planned_for, selectedDate));

  useLayoutEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    setRowHeight(measureRowHeight(container));

    if (isToday) {
      scrollTimelineToTime(container, now.getHours(), now.getMinutes());
      return;
    }

    container.scrollTop = 0;
  }, [selectedDate, isToday, now.getHours(), now.getMinutes()]);

  function objectiveLabels(objectiveIds: number[]): string | null {
    const labels = objectiveIds
      .map((id) => objectivesById.get(id))
      .filter(Boolean) as string[];
    return labels.length ? labels.join(", ") : null;
  }

  return (
    <>
      {showDayName && (
        <div className="border-b border-gray-200 py-2 text-center text-md text-gray-900">
          {formatDayName(selectedDate)}
        </div>
      )}

      {dayTasks.length > 0 && (
        <div className="flex flex-wrap gap-2 border-b border-gray-200 px-4 py-2">
          {dayTasks.map((task) => {
            const colors = getDomainClassesById(task.domain_id, domains);
            const obj = objectiveLabels(task.objective_ids ?? []);
            return (
              <button
                key={`${task.id}-${task.occurrence_date ?? task.planned_for}`}
                type="button"
                onClick={() => onEditTask(task)}
                className={`rounded px-2 py-1 text-xs ${colors.chip}`}
              >
                {task.name}
                {obj ? ` · ${obj}` : ""}
              </button>
            );
          })}
        </div>
      )}

      <div
        ref={scrollRef}
        className="relative overflow-y-auto"
        style={{ height: TIMELINE_VIEWPORT_HEIGHT }}
      >
        <div className="relative" style={{ paddingTop: TIMELINE_TOP_PADDING_PX }}>
          {isToday && (
            <CurrentTimeIndicator
              hour={now.getHours()}
              minute={now.getMinutes()}
              rowHeight={rowHeight}
            />
          )}

          {timed.map((event) => {
            const blockStyle = getEventBlockStyle(event, rowHeight, selectedDate);
            if (!blockStyle) return null;
            const { top, height } = blockStyle;
            const colors = getDomainClassesById(event.domain_id, domains);
            const key = eventOccurrenceKey(event);
            const obj = objectiveLabels(event.objective_ids ?? []);
            return (
              <div
                key={key}
                role="button"
                tabIndex={0}
                onDoubleClick={() => onEditEvent(event)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    onEditEvent(event);
                  }
                }}
                className={`absolute left-16 right-2 z-10 overflow-hidden rounded border px-2 py-1 text-left text-xs ${colors.block}`}
                style={{ top, height }}
              >
                <div className="flex items-start justify-between gap-1">
                  <div className="min-w-0">
                    <span className="line-clamp-2 font-medium">{event.title}</span>
                    {obj && <div className="truncate opacity-80">{obj}</div>}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditEvent(event);
                    }}
                    className="shrink-0 rounded p-0.5 opacity-70 hover:bg-black/10 hover:opacity-100"
                    aria-label={`Edit ${event.title}`}
                  >
                    <PencilSquareIcon className="size-3.5" />
                  </button>
                </div>
              </div>
            );
          })}

          {HOUR_SLOTS.map(({ hour, label }) => (
            <div key={hour} data-hour={hour} className={`relative flex ${HOUR_ROW_HEIGHT_CLASS}`}>
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
    </>
  );
}
