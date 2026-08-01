import { useEffect, useState } from "react";
import { fetchHealth } from "../api";
import { WEEKDAY_LABELS } from "../constants/calendar";
import { useCurrentTime } from "../hooks/useCurrentTime";
import { EventModal } from "../modals/EventModal";
import { buildMonthGrid, formatMonthYear } from "../utils/calendar";

export function CalendarView() {
  const now = useCurrentTime();
  const cells = buildMonthGrid(now);
  const [apiStatus, setApiStatus] = useState<string>("checking…");

  // Health check
  useEffect(() => {
    fetchHealth()
      .then((data) => setApiStatus(data.status))
      .catch(() => setApiStatus("unreachable"));
  }, []);
  
  const [showAddEventModal, setShowAddEventModal] = useState(false);

  // Add event
  const handleAddEvent = () => {
    setShowAddEventModal(true);
  };

  return (
    <section>
      {/* Calendar Heading and API status */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Calendar</h2>
          <p className="text-sm text-gray-500">{formatMonthYear(now)}</p>
        </div>
        {/* API status */}
        <span className="text-sm text-gray-500">API: {apiStatus}</span>
      </div>
      <div className="mb-4 flex items-center justify-end">
        <button onClick={handleAddEvent} className="bg-blue-500 text-white px-4 py-2 rounded-md">Add +</button>
      </div>
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-gray-200 bg-gray-200">
        {/* Weekday labels */}
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
              // Add day number
              <span className={`text-xs ${cell.isToday ? "font-semibold text-blue-600" : "text-gray-400"}`}>
                {cell.day}
              </span>
            )}
          </div>
        ))}
      </div>
      <EventModal
        showAddEventModal={showAddEventModal}
        onClose={() => setShowAddEventModal(false)}
      />
    </section>
  );
}
