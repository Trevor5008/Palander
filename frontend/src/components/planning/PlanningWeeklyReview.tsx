import { useState } from "react";
import { carryForwardTasks } from "../../api";
import { usePlanningWeeklyReview } from "../../hooks/usePlanningWeeklyReview";
import { addWeeks, formatDateForInput, formatWeekRange, startOfWeek } from "../../utils/date";

type PlanningWeeklyReviewProps = {
  weekStart: Date;
  onWeekChange: (d: Date) => void;
};

export function PlanningWeeklyReview({ weekStart, onWeekChange }: PlanningWeeklyReviewProps) {
  const weekStartIso = formatDateForInput(weekStart);
  const { data, loading, error, reload } = usePlanningWeeklyReview(weekStartIso);
  const [bulkDate, setBulkDate] = useState(weekStartIso);
  const [busy, setBusy] = useState(false);

  async function moveAllToDate() {
    if (!data?.carry_forward.length) return;
    setBusy(true);
    try {
      await carryForwardTasks(
        data.carry_forward.map((t) => ({ task_id: t.id, planned_for: bulkDate })),
      );
      await reload();
    } finally {
      setBusy(false);
    }
  }

  const weekEnd = data ? new Date(data.week_end + "T12:00:00") : weekStart;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded border border-gray-300 px-2 py-1 text-sm"
            onClick={() => onWeekChange(addWeeks(weekStart, -1))}
          >
            Prev
          </button>
          <span className="text-sm font-medium">{formatWeekRange(weekStart, weekEnd)}</span>
          <button
            type="button"
            className="rounded border border-gray-300 px-2 py-1 text-sm"
            onClick={() => onWeekChange(addWeeks(weekStart, 1))}
          >
            Next
          </button>
          <button
            type="button"
            className="rounded border border-gray-300 px-2 py-1 text-sm"
            onClick={() => onWeekChange(startOfWeek(new Date()))}
          >
            This week
          </button>
        </div>
      </div>

      {loading && <p className="text-sm text-gray-500">Loading weekly review…</p>}
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      {data && (
        <>
          <section className="rounded-lg border border-gray-200 bg-white p-4">
            <h3 className="mb-2 text-sm font-semibold text-gray-800">Domain allocation</h3>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs text-gray-500">
                  <th className="pb-2">Domain</th>
                  <th className="pb-2">Event min</th>
                  <th className="pb-2">Planned</th>
                  <th className="pb-2">Completed</th>
                  <th className="pb-2">Est. min</th>
                </tr>
              </thead>
              <tbody>
                {data.domain_allocation.map((row) => (
                  <tr key={row.domain_id} className="border-t border-gray-100">
                    <td className="py-1 capitalize">{row.domain_name}</td>
                    <td>{row.scheduled_event_minutes}</td>
                    <td>{row.tasks_planned}</td>
                    <td>{row.tasks_completed}</td>
                    <td>{row.planned_task_minutes ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-4">
            <h3 className="mb-2 text-sm font-semibold text-gray-800">Objective warnings</h3>
            {data.objective_warnings.length === 0 ? (
              <p className="text-sm text-gray-400">No warnings</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {data.objective_warnings.map((w) => (
                  <li key={`${w.objective_id}-${w.warning_type}`} className="text-gray-700">
                    <span className="font-medium">{w.objective_title}</span> — {w.message}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-gray-800">Carry forward</h3>
              {data.carry_forward.length > 0 && (
                <div className="flex items-center gap-2 text-xs">
                  <label>
                    Move all to
                    <input
                      type="date"
                      value={bulkDate}
                      onChange={(e) => setBulkDate(e.target.value)}
                      className="ml-1 rounded border border-gray-300 px-1"
                    />
                  </label>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void moveAllToDate()}
                    className="rounded bg-gray-800 px-2 py-1 text-white disabled:opacity-50"
                  >
                    Apply
                  </button>
                </div>
              )}
            </div>
            {data.carry_forward.length === 0 ? (
              <p className="text-sm text-gray-400">Nothing to carry forward</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {data.carry_forward.map((t) => (
                  <li key={t.id}>
                    {t.name} — planned {t.planned_for}, due {t.due_at.slice(0, 10)}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
