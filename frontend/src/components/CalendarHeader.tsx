import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { fetchHealth } from "../api";
import { formatMonthYear } from "../utils/calendar";

// Calendar Header component props
type CalendarHeaderProps = {
  viewDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onAdd: () => void;
};

// Calendar Header component
export function CalendarHeader({
  viewDate,
  onPrevMonth,
  onNextMonth,
  onToday,
  onAdd,
}: CalendarHeaderProps) {
  const [apiStatus, setApiStatus] = useState("checking…");

  // Fetch API health status on mount
  useEffect(() => {
    fetchHealth()
      .then((data) => setApiStatus(data.status))
      .catch(() => setApiStatus("unreachable"));
  }, []);

  // Render the Calendar Header component
  return (
    <>
      <div className="mb-4 flex shrink-0 items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Previous month"
            onClick={onPrevMonth}
            className="rounded p-1.5 text-gray-600 hover:bg-gray-100"
          >
            <ChevronLeftIcon className="size-5" />
          </button>
          <button
            type="button"
            aria-label="Next month"
            onClick={onNextMonth}
            className="rounded p-1.5 text-gray-600 hover:bg-gray-100"
          >
            <ChevronRightIcon className="size-5" />
          </button>
          <div>
            <h2 className="text-2xl font-semibold">Calendar</h2>
            <p className="text-sm text-gray-500">{formatMonthYear(viewDate)}</p>
          </div>
          <button
            type="button"
            onClick={onToday}
            className="rounded border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50"
          >
            today
          </button>
        </div>
        <span className="text-sm text-gray-500">API: {apiStatus}</span>
      </div>
      <div className="mb-3 flex shrink-0 items-center justify-end">
        <button
          type="button"
          onClick={onAdd}
          className="rounded-md bg-blue-500 px-4 py-2 text-white"
        >
          Add +
        </button>
      </div>
    </>
  );
}
