import { useEffect, useState } from "react";
import { fetchHealth } from "../api";
import { WEEKDAY_LABELS } from "../constants/calendar";
import { useCurrentTime } from "../hooks/useCurrentTime";
import { buildMonthGrid, formatMonthYear } from "../utils/calendar";

export function CalendarView() {
  const now = useCurrentTime();
  const cells = buildMonthGrid(now);
  const [apiStatus, setApiStatus] = useState<string>("checking…");

  useEffect(() => {
    fetchHealth()
      .then((data) => setApiStatus(data.status))
      .catch(() => setApiStatus("unreachable"));
  }, []);

  return (
    <section>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Calendar</h2>
          <p className="text-sm text-gray-500">{formatMonthYear(now)}</p>
        </div>
        <span className="text-sm text-gray-500">API: {apiStatus}</span>
      </div>
      <p className="mb-4 text-sm text-gray-600">
        Monthly grid placeholder — tasks and events will appear as markers on each day.
      </p>
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-gray-200 bg-gray-200">
        {WEEKDAY_LABELS.map((day) => (
          <div key={day} className="bg-gray-100 px-2 py-1 text-center text-xs font-medium text-gray-500">
            {day}
          </div>
        ))}
        {cells.map((cell) => (
          <div
            key={cell.key}
            className={`min-h-20 p-2 ${cell.isCurrentMonth ? "bg-white" : "bg-gray-50"} ${cell.isToday ? "ring-2 ring-inset ring-blue-400" : ""}`}
          >
            {cell.day !== null && (
              <span className={`text-xs ${cell.isToday ? "font-semibold text-blue-600" : "text-gray-400"}`}>
                {cell.day}
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
