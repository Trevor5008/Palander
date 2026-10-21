import { WEEKDAY_LABELS } from "../constants/calendar";
import { CalendarDayCell } from "./Calendar/CalendarDayCell";
import { CalendarWeekdayLabel } from "./Calendar/CalendarWeekdayLabel";
import type { DomainRead, EventRead, TaskRead } from "../types/api";
import { dayFromCellKey, isSameApiDay } from "../utils/apiMappers";
import { getEventsForDay } from "../utils/eventSegments";
import type { CalendarCell } from "../utils/calendar";

// Calendar Grid component props
type CalendarGridProps = {
  cells: CalendarCell[];
  events: EventRead[];
  tasks: TaskRead[];
  domains: DomainRead[];
  onEditEvent: (event: EventRead) => void;
  onEditTask: (task: TaskRead) => void;
  onCreateForDay?: (date: Date) => void;
};

// Calendar Grid component
export function CalendarGrid({
  cells,
  events,
  tasks,
  domains,
  onEditEvent,
  onEditTask,
  onCreateForDay,
}: CalendarGridProps) {
  // Render the Calendar Grid component
  return (
    <div className="grid min-h-0 flex-1 grid-cols-7 grid-rows-[auto_repeat(6,minmax(0,1fr))] overflow-hidden rounded-lg border border-gray-200 bg-white">
      {/* Render the Calendar Weekday Labels */}
      {WEEKDAY_LABELS.map((day) => (
        <CalendarWeekdayLabel key={day} label={day} />
      ))}
      {/* Render the Calendar Day Cells */}
      {cells.map((cell) => {
        // Get the cell date
        const cellDate = dayFromCellKey(cell.key);
        const dayEvents = cellDate ? getEventsForDay(events, cellDate) : [];
        // Get the day tasks
        const dayTasks = cellDate
          ? tasks.filter((t) => isSameApiDay(t.due_date, cellDate))
          : [];

        // Render the Calendar Day Cell component
        return (
          <CalendarDayCell
            key={cell.key}
            cell={cell}
            events={dayEvents}
            tasks={dayTasks}
            domains={domains}
            onEditEvent={onEditEvent}
            onEditTask={onEditTask}
            onCreateForDay={
              cellDate && onCreateForDay ? () => onCreateForDay(cellDate) : undefined
            }
          />
        );
      })}
    </div>
  );
}
