import { PencilSquareIcon } from "@heroicons/react/24/outline";
import { getDomainClassesById } from "../constants/domainColors";
import type { DomainRead, EventRead } from "../types/api";
import { eventOccurrenceKey } from "../utils/recurrence";

type AllDayRowProps = {
  events: EventRead[];
  domains: DomainRead[];
  objectivesById: Map<number, string>;
  onEditEvent: (event: EventRead) => void;
};

export function AllDayRow({
  events,
  domains,
  objectivesById,
  onEditEvent,
}: AllDayRowProps) {
  if (events.length === 0) return null;

  return (
    <div className="border-b border-border px-4 py-2">
      <div className="type-section mb-1">All day</div>
      <div className="flex flex-wrap gap-2">
        {events.map((event) => {
          const colors = getDomainClassesById(event.domain_id, domains);
          const key = eventOccurrenceKey(event);
          const objLabels = (event.objective_ids ?? [])
            .map((id) => objectivesById.get(id))
            .filter(Boolean);
          const obj = objLabels.length ? objLabels.join(", ") : null;
          return (
            <div
              key={key}
              className={`inline-flex items-center gap-1 ${colors.chip}`}
            >
              <button
                type="button"
                onDoubleClick={() => onEditEvent(event)}
                onClick={() => onEditEvent(event)}
                className="max-w-[14rem] truncate text-left"
              >
                {event.title}
                {obj ? ` · ${obj}` : ""}
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
