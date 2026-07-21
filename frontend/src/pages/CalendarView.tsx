import { useEffect, useState } from "react";
import { fetchHealth } from "../api";

// TODO: Move to constants file
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarView() {
  // TODO: Move to context
  const [apiStatus, setApiStatus] = useState<string>("checking…");

  // TODO: Move to hook
  useEffect(() => {
    fetchHealth()
      .then((data) => setApiStatus(data.status))
      .catch(() => setApiStatus("unreachable"));
  }, []);

  // TODO: Move to component
  return (
    <section>
      {/* TODO: Move to component */}
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Calendar</h2>
        <span className="text-sm text-gray-500">API: {apiStatus}</span>
      </div>
      {/* Description */}
      <p className="mb-4 text-sm text-gray-600">
        Monthly grid placeholder — tasks and events will appear as markers on each day.
      </p>
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-gray-200 bg-gray-200">
        {DAYS.map((day) => (
          <div key={day} className="bg-gray-100 px-2 py-1 text-center text-xs font-medium text-gray-500">
            {day}
          </div>
        ))}
        {/* Days */}
        {Array.from({ length: 35 }, (_, i) => (
          <div key={i} className="min-h-20 bg-white p-2">
            <span className="text-xs text-gray-400">{i + 1}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
