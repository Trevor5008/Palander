import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { fetchEvents, fetchTasks } from "../api";
import { CurrentTimeIndicator } from "../components/CurrentTimeIndicator";
import {
  getAnchoredTimeScrollTop,
  getTimeOffsetPx,
  HOUR_ROW_HEIGHT_CLASS,
  HOUR_SLOTS,
  TIMELINE_TOP_PADDING_PX,
  TIMELINE_VIEWPORT_HEIGHT,
} from "../constants/time";
import { useCurrentTime } from "../hooks/useCurrentTime";
import { EventModal } from "../modals/EventModal";
import type { EventRead, TaskRead } from "../types/api";
import { endOfDay, isSameApiDay, toApiDateTime } from "../utils/apiMappers";
import { addDays, formatDate, formatDayName, isSameDay, startOfDay } from "../utils/date";

// Helper for measuring the height of a row in the timeline
function measureRowHeight(container: HTMLDivElement): number {
  return container.querySelector<HTMLElement>("[data-hour]")?.offsetHeight ?? 40;
}

// Helper for scrolling the timeline to a specific time
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

function getEventBlockStyle(event: EventRead, rowHeight: number) {
  const start = new Date(event.start_at);
  const end = new Date(event.end_at);
  const top = getTimeOffsetPx(start.getHours(), start.getMinutes(), rowHeight);
  const durationMs = Math.max(end.getTime() - start.getTime(), 15 * 60 * 1000);
  const height = (durationMs / (1000 * 60 * 60)) * rowHeight;
  return { top, height: Math.max(height, rowHeight * 0.35) };
}

// Daily view component
export function DailyView() {
  const now = useCurrentTime();
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(now));
  const [rowHeight, setRowHeight] = useState(40);
  const [showAddModal, setShowAddModal] = useState(false);
  const [events, setEvents] = useState<EventRead[]>([]);
  const [tasks, setTasks] = useState<TaskRead[]>([]);
  const [editEvent, setEditEvent] = useState<EventRead | null>(null);
  const [editTask, setEditTask] = useState<TaskRead | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isToday = isSameDay(selectedDate, now);

  // Load entries for the day
  const loadEntries = useCallback(async () => {
    const start = toApiDateTime(startOfDay(selectedDate));
    const end = toApiDateTime(endOfDay(selectedDate));
    const [eventData, taskData] = await Promise.all([
      fetchEvents(start, end),
      fetchTasks(start, end),
    ]);
    setEvents(eventData);
    setTasks(taskData);
  }, [selectedDate]);

  // Load entries for the day on mount
  useEffect(() => {
    loadEntries().catch(() => {
      setEvents([]);
      setTasks([]);
    });
  }, [loadEntries]);

  // On layout, orient the timeline to the current time
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

  const openCreate = () => {
    setEditEvent(null);
    setEditTask(null);
    setShowAddModal(true);
  };

  const openEditEvent = (event: EventRead) => {
    setEditEvent(event);
    setEditTask(null);
    setShowAddModal(true);
  };

  const openEditTask = (task: TaskRead) => {
    setEditTask(task);
    setEditEvent(null);
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditEvent(null);
    setEditTask(null);
  };

  const dayTasks = tasks.filter((t) => isSameApiDay(t.due_date, selectedDate));

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

        {/* Display the date */}
        <h2 className="text-center text-lg font-semibold">{formatDate(selectedDate)}</h2>

        {/* Add event/task button */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={openCreate}
            className="rounded border border-gray-300 p-1.5 text-sm text-gray-600 hover:bg-gray-100"
          >
            add +
          </button>
        </div>
      </div>

      {/* Display the day name */}
      <div className="border-b border-gray-200 py-2 text-center text-md text-gray-900">
        {formatDayName(selectedDate)}
      </div>

      {/* Display each task for the day */}
      {dayTasks.length > 0 && (
        <div className="flex flex-wrap gap-2 border-b border-gray-200 px-4 py-2">
          {dayTasks.map((task) => (
            <button
              key={task.id}
              type="button"
              onClick={() => openEditTask(task)}
              className="rounded bg-amber-100 px-2 py-1 text-xs text-amber-900 hover:bg-amber-200"
            >
              {task.name}
            </button>
          ))}
        </div>
      )}

      {/* Container for the timeline */}
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

          {/* Display each event for the day */}
          {events.map((event) => {
            const { top, height } = getEventBlockStyle(event, rowHeight);
            return (
              <button
                key={event.id}
                type="button"
                onClick={() => openEditEvent(event)}
                className="absolute left-16 right-2 z-10 overflow-hidden rounded border border-blue-300 bg-blue-100 px-2 py-1 text-left text-xs text-blue-900 hover:bg-blue-200"
                style={{ top, height }}
              >
                <span className="line-clamp-2 font-medium">{event.title}</span>
              </button>
            );
          })}
          {/* Display each hour for the day */} 
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
        
      {/* Event modal */}
      <EventModal
        showAddEventModal={showAddModal}
        onClose={closeModal}
        defaultDate={selectedDate}
        editEvent={editEvent}
        editTask={editTask}
        onSaved={loadEntries}
        onDeleted={loadEntries}
      />
    </section>
  );
}
