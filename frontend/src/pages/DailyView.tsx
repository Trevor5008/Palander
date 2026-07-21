import { CurrentHourIndicator } from "../components/CurrentHourIndicator";
import { HOUR_SLOTS } from "../constants/time";
import { useCurrentTime } from "../hooks/useCurrentTime";

export function DailyView() {
  const now = useCurrentTime();
  const currentHour = now.getHours();

  return (
    <section>
      {/* TODO: Move to component */}
      {/* Header */}
      <h2 className="mb-6 text-2xl font-semibold">Daily</h2>
      {/* Description */}
      <p className="mb-4 text-sm text-gray-600">
        Timeline placeholder — tasks and events will be listed chronologically.
      </p>
      {/* Timeline */}
      <div className="relative rounded-lg border border-gray-200">
        {/* Hours */}
        {HOUR_SLOTS.map(({ hour, label }) => (
          <div key={hour} className="relative flex border-b border-gray-100 last:border-b-0">
            <div className="w-16 shrink-0 px-3 py-4 text-xs text-gray-400">{label}</div>
            <div className="flex-1 py-4">
              {hour === currentHour && <CurrentHourIndicator />}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
