import { PencilSquareIcon } from "@heroicons/react/24/outline";
import { getDomainClassesById } from "../constants/domainColors";
import type { DomainRead, EventRead } from "../types/api";
import { eventOccurrenceKey } from "../utils/recurrence";

type AllDayRowProps = {
  events: EventRead[];
  domains: DomainRead[];
  selectedEventKey?: string | null;
  onSelectEvent?: (event: EventRead) => void;
  onEditEvent: (event: EventRead) => void;
};

export function AllDayRow({
  events,
  domains,
  selectedEventKey = null,
  onSelectEvent,
  onEditEvent,
}: AllDayRowProps) {
  if (events.length === 0) return null;

  return (
    <div className="border-b border-gray-200 px-4 py-2">
      <div className="mb-1 text-xs font-medium text-gray-500">All day</div>
      <div className="flex flex-wrap gap-2">
        {events.map((event) => {
          const colors = getDomainClassesById(event.domain_id, domains);
          const key = eventOccurrenceKey(event);
          const selected = selectedEventKey === key;
          return (
            <div
              key={key}
              className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs ${colors.chip} ${
                selected ? "ring-2 ring-blue-600 ring-offset-1" : ""
              }`}
            >
              <button
                type="button"
                onClick={() => onSelectEvent?.(event)}
                onDoubleClick={() => onEditEvent(event)}
                className="max-w-[14rem] truncate text-left"
              >
                {event.title}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditEvent(event);
                }}
                className="rounded p-0.5 opacity-70 hover:opacity-100"
                aria-label={`Edit ${event.title}`}
              >
                <PencilSquareIcon className="size-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
