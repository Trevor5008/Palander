import { WEEKDAY_LABELS } from "../constants/calendar";
import type { EventRead, TaskRead } from "../types/api";
import { isSameApiDay } from "../utils/apiMappers";
import { addDays, isSameDay } from "../utils/date";

type WeekStripProps = {
  weekStart: Date;
  selectedDate: Date;
  events: EventRead[];
  tasks: TaskRead[];
  onSelectDate: (date: Date) => void;
};

function countEntriesForDay(day: Date, events: EventRead[], tasks: TaskRead[]): number {
  const eventCount = events.filter((e) => isSameApiDay(e.start_at, day)).length;
  const taskCount = tasks.filter((t) => isSameApiDay(t.due_date, day)).length;
  return eventCount + taskCount;
}

export function WeekStrip({
  weekStart,
  selectedDate,
  events,
  tasks,
  onSelectDate,
}: WeekStripProps) {
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="grid grid-cols-7 border-b border-gray-200">
      {days.map((day, index) => {
        const isSelected = isSameDay(day, selectedDate);
        const isToday = isSameDay(day, today);
        const entryCount = countEntriesForDay(day, events, tasks);

        return (
          <button
            key={day.toISOString()}
            type="button"
            onClick={() => onSelectDate(day)}
            className={`flex flex-col items-center gap-1 border-r border-gray-100 px-2 py-3 last:border-r-0 ${
              isSelected ? "bg-blue-50" : "hover:bg-gray-50"
            }`}
          >
            <span className="text-xs font-medium text-gray-500">{WEEKDAY_LABELS[index]}</span>
            <span
              className={`flex size-8 items-center justify-center rounded-full text-sm ${
                isToday
                  ? "bg-blue-600 font-semibold text-white"
                  : isSelected
                    ? "font-semibold text-blue-700"
                    : "text-gray-900"
              }`}
            >
              {day.getDate()}
            </span>
            {entryCount > 0 && (
              <span className="size-1.5 rounded-full bg-blue-400" aria-label={`${entryCount} entries`} />
            )}
          </button>
        );
      })}
    </div>
  );
}
