import { WEEKDAY_LABELS } from "../constants/calendar";
import { CalendarDayCell } from "./calendar/CalendarDayCell";
import { CalendarWeekdayLabel } from "./calendar/CalendarWeekdayLabel";
import type { DomainRead, EventRead, TaskRead } from "../types/api";
import { dayFromCellKey, isSameApiDay } from "../utils/apiMappers";
import type { CalendarCell } from "../utils/calendar";

// Calendar Grid component props
type CalendarGridProps = {
  cells: CalendarCell[];
  events: EventRead[];
  tasks: TaskRead[];
  domains: DomainRead[];
  onEditEvent: (event: EventRead) => void;
  onEditTask: (task: TaskRead) => void;
};

// Calendar Grid component
export function CalendarGrid({
  cells,
  events,
  tasks,
  domains,
  onEditEvent,
  onEditTask,
}: CalendarGridProps) {
  // Render the Calendar Grid component
  return (
    <div className="grid min-h-0 flex-1 grid-cols-7 grid-rows-[auto_repeat(6,minmax(0,1fr))] gap-px overflow-hidden rounded-lg border border-gray-200 bg-gray-200">
      {/* Render the Calendar Weekday Labels */}
      {WEEKDAY_LABELS.map((day) => (
        <CalendarWeekdayLabel key={day} label={day} />
      ))}
      {/* Render the Calendar Day Cells */}
      {cells.map((cell) => {
        // Get the cell date
        const cellDate = dayFromCellKey(cell.key);
        const dayEvents = cellDate
          ? events.filter((e) => isSameApiDay(e.start_at, cellDate))
          : [];
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
          />
        );
      })}
    </div>
  );
}
