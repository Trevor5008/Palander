// TODO: Move to constants file
const HOURS = Array.from({ length: 24 }, (_, i) => {
  const hour = i % 12 || 12;
  const period = i < 12 ? "am" : "pm";
  return `${hour}${period}`;
});

// TODO: Move to component
export function DailyView() {
  // TODO: Move to hook
  const now = new Date();
  const currentHour = now.getHours();

  return (
    <section>
      {/* TODO: Move to component */}
      {/* Header */}
      <h2 className="mb-6 text-2xl font-semibold">Daily</h2>
      <p className="mb-4 text-sm text-gray-600">
        Timeline placeholder — tasks and events will be listed chronologically.
      </p>
      {/* Timeline */}
      <div className="relative rounded-lg border border-gray-200">
        {/* Hours */}
        {HOURS.map((label, i) => (
          <div key={label} className="relative flex border-b border-gray-100 last:border-b-0">
            <div className="w-16 shrink-0 px-3 py-4 text-xs text-gray-400">{label}</div>
            <div className="flex-1 py-4">
              {/* TODO: Move to component */}
              {/* Current hour indicator */}
              {i === currentHour && (
                <div className="absolute left-16 right-0 flex items-center">
                  <div className="h-0.5 flex-1 bg-red-400" />
                  <span className="px-2 text-xs text-red-500">now</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
