import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { useEffect, useMemo, useState } from "react";
import { fetchHealth } from "../api";
import { getDomainClassesById } from "../constants/domainColors";
import { WEEKDAY_LABELS } from "../constants/calendar";
import { useDomains } from "../hooks/useDomains";
import { useEntriesRange } from "../hooks/useEntriesRange";
import { useEventTaskModal } from "../hooks/useEventTaskModal";
import { EventModal } from "../modals/EventModal";
import {
  dayFromCellKey,
  endOfMonth,
  isSameApiDay,
  startOfMonth,
} from "../utils/apiMappers";
import { buildMonthGrid, formatMonthYear } from "../utils/calendar";
import { addMonths, startOfDay } from "../utils/date";

export function CalendarView() {
  const today = useMemo(() => startOfDay(new Date()), []);
  const [viewDate, setViewDate] = useState(() => startOfDay(new Date()));
  const [apiStatus, setApiStatus] = useState<string>("checking…");
  const domains = useDomains();

  const rangeStart = useMemo(() => startOfMonth(viewDate), [viewDate]);
  const rangeEnd = useMemo(() => endOfMonth(viewDate), [viewDate]);
  const { events, tasks, reload } = useEntriesRange(rangeStart, rangeEnd);

  const cells = buildMonthGrid(viewDate, today);

  const {
    showModal,
    editEvent,
    editTask,
    modalDate,
    openCreate,
    openEditEvent,
    openEditTask,
    closeModal,
  } = useEventTaskModal(viewDate);

  useEffect(() => {
    fetchHealth()
      .then((data) => setApiStatus(data.status))
      .catch(() => setApiStatus("unreachable"));
  }, []);

  return (
    <section className="flex min-h-0 flex-1 flex-col pt-4">
      <div className="mb-4 flex shrink-0 items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => setViewDate((date) => addMonths(date, -1))}
            className="rounded p-1.5 text-gray-600 hover:bg-gray-100"
          >
            <ChevronLeftIcon className="size-5" />
          </button>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => setViewDate((date) => addMonths(date, 1))}
            className="rounded p-1.5 text-gray-600 hover:bg-gray-100"
          >
            <ChevronRightIcon className="size-5" />
          </button>
          <div>
            <h2 className="text-2xl font-semibold">Calendar</h2>
            <p className="text-sm text-gray-500">{formatMonthYear(viewDate)}</p>
          </div>
          <button
            type="button"
            onClick={() => setViewDate(today)}
            className="rounded border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50"
          >
            today
          </button>
        </div>
        <span className="text-sm text-gray-500">API: {apiStatus}</span>
      </div>
      <div className="mb-3 flex shrink-0 items-center justify-end">
        <button
          type="button"
          onClick={() => openCreate(viewDate)}
          className="rounded-md bg-blue-500 px-4 py-2 text-white"
        >
          Add +
        </button>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-7 grid-rows-[auto_repeat(6,minmax(0,1fr))] gap-px overflow-hidden rounded-lg border border-gray-200 bg-gray-200">
        {WEEKDAY_LABELS.map((day) => (
          <div
            key={day}
            className="bg-gray-100 px-2 py-2 text-center text-xs font-medium text-gray-500"
          >
            {day}
          </div>
        ))}
        {cells.map((cell) => {
          const cellDate = dayFromCellKey(cell.key);
          const dayEvents = cellDate
            ? events.filter((e) => isSameApiDay(e.start_at, cellDate))
            : [];
          const dayTasks = cellDate
            ? tasks.filter((t) => isSameApiDay(t.due_date, cellDate))
            : [];

          return (
            <div
              key={cell.key}
              className={`flex min-h-0 flex-col overflow-hidden p-1.5 ${cell.isCurrentMonth ? "bg-white" : "bg-gray-50"} ${cell.isToday ? "ring-2 ring-inset ring-blue-400" : ""}`}
            >
              {cell.day !== null && (
                <span
                  className={`mb-1 block shrink-0 text-xs ${cell.isToday ? "font-semibold text-blue-600" : "text-gray-400"}`}
                >
                  {cell.day}
                </span>
              )}
              <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto">
                {dayEvents.map((event) => {
                  const colors = getDomainClassesById(event.domain_id, domains);
                  return (
                    <button
                      key={`e-${event.id}`}
                      type="button"
                      onClick={() => openEditEvent(event)}
                      className={`block w-full truncate rounded px-1 text-left text-[10px] ${colors.chip}`}
                    >
                      {event.title}
                    </button>
                  );
                })}
                {dayTasks.map((task) => {
                  const colors = getDomainClassesById(task.domain_id, domains);
                  return (
                    <button
                      key={`t-${task.id}`}
                      type="button"
                      onClick={() => openEditTask(task)}
                      className={`block w-full truncate rounded px-1 text-left text-[10px] ${colors.chip}`}
                    >
                      {task.name}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <EventModal
        showAddEventModal={showModal}
        onClose={closeModal}
        defaultDate={modalDate}
        editEvent={editEvent}
        editTask={editTask}
        onSaved={reload}
        onDeleted={reload}
      />
    </section>
  );
}
