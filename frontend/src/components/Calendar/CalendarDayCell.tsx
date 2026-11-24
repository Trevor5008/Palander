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
  const MAX_VISIBLE = 4;
  type Row = { kind: "event" | "task"; key: string; label: string; domainId: number | null | undefined; onEdit: () => void };
  const rows: Row[] = [
    ...events.map((event) => ({
      kind: "event" as const,
      key: `e-${eventOccurrenceKey(event)}`,
      label: event.title,
      domainId: event.domain_id,
      onEdit: () => onEditEvent(event),
    })),
    ...tasks.map((task) => ({
      kind: "task" as const,
      key: `t-${task.id}`,
      label: task.name,
      domainId: task.domain_id,
      onEdit: () => onEditTask(task),
    })),
  ];
  const visible = rows.slice(0, MAX_VISIBLE);
  const overflow = rows.length - visible.length;

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
      className={`shadow-tile flex min-h-0 flex-col overflow-hidden rounded-[8px] border border-border p-1.5 ${cell.isCurrentMonth ? "bg-surface" : "bg-bg"} ${cell.isToday ? "border-today ring-1 ring-today" : ""} ${isInteractive ? "cursor-pointer hover:brightness-105" : ""}`}
    >
      {cell.day !== null && (
        <span
          className={`font-display mb-1 block shrink-0 text-[17px] leading-none ${cell.isToday ? "text-today" : "text-text-muted"}`}
        >
          {cell.day}
        </span>
      )}
      <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto">
        {visible.map((row) => (
          <CalendarEntryChip
            key={row.key}
            label={row.label}
            domainId={row.domainId}
            domains={domains}
            onClick={(e) => {
              e.stopPropagation();
              row.onEdit();
            }}
          />
        ))}
        {overflow > 0 && (
          <p className="px-0.5 text-[10px] text-text-muted">+{overflow} more</p>
        )}
      </div>
    </div>
  );
}
