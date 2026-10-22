import type { DomainRead, EventRead, TaskRead } from "../../types/api";
import { eventOccurrenceKey } from "../../utils/recurrence";
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
  onCreateForDay?: () => void;
};

// Calendar Day Cell component
export function CalendarDayCell({
  cell,
  events,
  tasks,
  domains,
  onEditEvent,
  onEditTask,
  onCreateForDay,
}: CalendarDayCellProps) {
  const isInteractive = cell.day !== null && onCreateForDay;

  return (
    <div
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={isInteractive ? onCreateForDay : undefined}
      onKeyDown={
        isInteractive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onCreateForDay();
              }
            }
          : undefined
      }
      className={`flex min-h-0 flex-col overflow-hidden border border-gray-200 p-1.5 ${cell.isCurrentMonth ? "bg-white" : "bg-gray-50"} ${cell.isToday ? "ring-2 ring-inset ring-blue-400" : ""} ${isInteractive ? "cursor-pointer hover:bg-gray-50/80" : ""}`}
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
            key={`e-${eventOccurrenceKey(event)}`}
            label={event.title}
            domainId={event.domain_id}
            domains={domains}
            onClick={(e) => {
              e.stopPropagation();
              onEditEvent(event);
            }}
          />
        ))}
        {tasks.map((task) => (
          <CalendarEntryChip
            key={`t-${task.id}`}
            label={task.name}
            domainId={task.domain_id}
            domains={domains}
            onClick={(e) => {
              e.stopPropagation();
              onEditTask(task);
            }}
          />
        ))}
      </div>
    </div>
  );
}
