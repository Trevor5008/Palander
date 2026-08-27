import { getDomainClassesById } from "../constants/domainColors";
import type { DomainRead, EventRead } from "../types/api";

type AllDayRowProps = {
  events: EventRead[];
  domains: DomainRead[];
  onEditEvent: (event: EventRead) => void;
};

export function AllDayRow({ events, domains, onEditEvent }: AllDayRowProps) {
  if (events.length === 0) return null;

  return (
    <div className="border-b border-gray-200 px-4 py-2">
      <div className="mb-1 text-xs font-medium text-gray-500">All day</div>
      <div className="flex flex-wrap gap-2">
        {events.map((event) => {
          const colors = getDomainClassesById(event.domain_id, domains);
          return (
            <button
              key={event.id}
              type="button"
              onClick={() => onEditEvent(event)}
              className={`rounded px-2 py-1 text-xs ${colors.chip}`}
            >
              {event.title}
            </button>
          );
        })}
      </div>
    </div>
  );
}
