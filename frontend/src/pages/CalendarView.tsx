import { useCallback, useEffect, useState } from "react";
// API functions
import { fetchEvents, fetchHealth, fetchTasks } from "../api";
// Constants for the calendar
import { WEEKDAY_LABELS } from "../constants/calendar";
// Hooks
import { useCurrentTime } from "../hooks/useCurrentTime";
// Modals
import { EventModal } from "../modals/EventModal";
// Types
import type { EventRead, TaskRead } from "../types/api";
// API mappers
import {
  dayFromCellKey,
  endOfMonth,
  isSameApiDay,
  startOfMonth,
  toApiDateTime,
} from "../utils/apiMappers";
// Frontend utils
import { buildMonthGrid, formatMonthYear } from "../utils/calendar";

// Monthly calendar view component
export function CalendarView() {
  const now = useCurrentTime();
  const cells = buildMonthGrid(now);
  const [apiStatus, setApiStatus] = useState<string>("checking…");
  const [events, setEvents] = useState<EventRead[]>([]);
  const [tasks, setTasks] = useState<TaskRead[]>([]);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [editEvent, setEditEvent] = useState<EventRead | null>(null);
  const [editTask, setEditTask] = useState<TaskRead | null>(null);
  const [modalDate, setModalDate] = useState(now);

  // Load entries for the month
  const loadEntries = useCallback(async () => {
    const start = toApiDateTime(startOfMonth(now));
    const end = toApiDateTime(endOfMonth(now));
    const [eventData, taskData] = await Promise.all([
      fetchEvents(start, end),
      fetchTasks(start, end),
    ]);
    setEvents(eventData);
    setTasks(taskData);
  }, [now]);

  useEffect(() => {
    fetchHealth()
      .then((data) => setApiStatus(data.status))
      .catch(() => setApiStatus("unreachable"));
  }, []);

  useEffect(() => {
    loadEntries().catch(() => {
      setEvents([]);
      setTasks([]);
    });
  }, [loadEntries]);

// TODO: Same methods can be used for DailyView (utilities?)
  const openCreate = () => {
    setEditEvent(null);
    setEditTask(null);
    setModalDate(now);
    setShowAddEventModal(true);
  };

  const openEditEvent = (event: EventRead) => {
    setEditEvent(event);
    setEditTask(null);
    setModalDate(new Date(event.start_at));
    setShowAddEventModal(true);
  };

  const openEditTask = (task: TaskRead) => {
    setEditTask(task);
    setEditEvent(null);
    setModalDate(new Date(task.due_date));
    setShowAddEventModal(true);
  };

  const closeModal = () => {
    setShowAddEventModal(false);
    setEditEvent(null);
    setEditTask(null);
  };

  return (
    <section>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Calendar</h2>
          <p className="text-sm text-gray-500">{formatMonthYear(now)}</p>
        </div>
        <span className="text-sm text-gray-500">API: {apiStatus}</span>
      </div>
      <div className="mb-4 flex items-center justify-end">
        <button
          onClick={openCreate}
          className="rounded-md bg-blue-500 px-4 py-2 text-white"
        >
          Add +
        </button>
      </div>
      {/* Container for the monthly view calendar */}
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-gray-200 bg-gray-200">
        {/* Header for the calendar */}
        {/* Display each day of the week */}
        {WEEKDAY_LABELS.map((day) => (
          <div
            key={day}
            className="bg-gray-100 px-2 py-1 text-center text-xs font-medium text-gray-500"
          >
            {day}
          </div>
        ))}
        {/* Display each cell in the calendar */}
        {cells.map((cell) => {
          const cellDate = dayFromCellKey(cell.key);
          const dayEvents = cellDate
            ? events.filter((e) => isSameApiDay(e.start_at, cellDate))
            : [];
          const dayTasks = cellDate
            ? tasks.filter((t) => isSameApiDay(t.due_date, cellDate))
            : [];

          // Render each cell in the monthly view
          return (
            <div
              key={cell.key}
              className={`min-h-24 p-1 ${cell.isCurrentMonth ? "bg-white" : "bg-gray-50"} ${cell.isToday ? "ring-2 ring-inset ring-blue-400" : ""}`}
            >
              {cell.day !== null && (
                <span
                  className={`mb-1 block text-xs ${cell.isToday ? "font-semibold text-blue-600" : "text-gray-400"}`}
                >
                  {cell.day}
                </span>
              )}
              <div className="space-y-0.5">
                {dayEvents.map((event) => (
                  <button
                    key={`e-${event.id}`}
                    type="button"
                    onClick={() => openEditEvent(event)}
                    className="block w-full truncate rounded bg-blue-100 px-1 text-left text-[10px] text-blue-800 hover:bg-blue-200"
                  >
                    {event.title}
                  </button>
                ))}
                {dayTasks.map((task) => (
                  <button
                    key={`t-${task.id}`}
                    type="button"
                    onClick={() => openEditTask(task)}
                    className="block w-full truncate rounded bg-amber-100 px-1 text-left text-[10px] text-amber-900 hover:bg-amber-200"
                  >
                    {task.name}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Event modal (crud ops for events/tasks) */}
      <EventModal
        showAddEventModal={showAddEventModal}
        onClose={closeModal}
        defaultDate={modalDate}
        editEvent={editEvent}
        editTask={editTask}
        onSaved={loadEntries}
        onDeleted={loadEntries}
      />
    </section>
  );
}
