import type { DomainRead, EventRead, TaskRead } from "../../types/api";
import type { CalendarCell } from "../../utils/calendar";
import { CalendarEntryChip } from "./CalendarEntryChip";

// Calendar Day Cell component props
type CalendarDayCellProps = {
  cell: CalendarCell;
  events: EventRead[];
  tasks: TaskRead[];
  domains: DomainRead[];
  onEditEvent: (event: EventRead) => void;
  onEditTask: (task: TaskRead) => void;
};

// Calendar Day Cell component
export function CalendarDayCell({
  cell,
  events,
  tasks,
  domains,
  onEditEvent,
  onEditTask,
}: CalendarDayCellProps) {
  // Render the Calendar Day Cell component
  return (
    <div
      className={`flex min-h-0 flex-col overflow-hidden p-1.5 ${cell.isCurrentMonth ? "bg-white" : "bg-gray-50"} ${cell.isToday ? "ring-2 ring-inset ring-blue-400" : ""}`}
    >
      {/* Render the day number */}
      {cell.day !== null && (
        <span
          className={`mb-1 block shrink-0 text-xs ${cell.isToday ? "font-semibold text-blue-600" : "text-gray-400"}`}
        >
          {cell.day}
        </span>
      )}
      <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto">
        {events.map((event) => (
          <CalendarEntryChip
            key={`e-${event.id}`}
            label={event.title}
            domainId={event.domain_id}
            domains={domains}
            onClick={() => onEditEvent(event)}
          />
        ))}
        {tasks.map((task) => (
          <CalendarEntryChip
            key={`t-${task.id}`}
            label={task.name}
            domainId={task.domain_id}
            domains={domains}
            onClick={() => onEditTask(task)}
          />
        ))}
      </div>
    </div>
  );
}
