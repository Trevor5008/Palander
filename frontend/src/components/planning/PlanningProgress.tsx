import { usePlanningProgress } from "../../hooks/usePlanningProgress";

export function PlanningProgress() {
  const { data, loading, error } = usePlanningProgress(8);

  if (loading) return <p className="text-sm text-text-muted">Loading progress…</p>;
  if (error) {
    return (
      <p className="text-sm text-red-600" role="alert">
        {error}
      </p>
    );
  }
  if (!data) return null;

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-border bg-surface p-4">
        <h3 className="mb-2 text-sm font-semibold text-text">Recently completed objectives</h3>
        {data.recently_completed_objectives.length === 0 ? (
          <p className="text-sm text-text-muted">None in the lookback window</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {data.recently_completed_objectives.map((o) => (
              <li key={o.objective_id}>
                {o.title} — {o.completed_at.slice(0, 10)}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-lg border border-border bg-surface p-4">
        <h3 className="mb-2 text-sm font-semibold text-text">Objective activity by week</h3>
        {data.objective_weekly_activity.length === 0 ? (
          <p className="text-sm text-text-muted">No activity recorded</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-text-muted">
                  <th className="pb-2 pr-4">Week</th>
                  <th className="pb-2 pr-4">Objective</th>
                  <th className="pb-2">Planned</th>
                  <th className="pb-2">Done</th>
                </tr>
              </thead>
              <tbody>
                {data.objective_weekly_activity.map((row) => (
                  <tr key={`${row.objective_id}-${row.week_start}`} className="border-t border-border">
                    <td className="py-1 pr-4">{row.week_start}</td>
                    <td className="py-1 pr-4">{row.objective_title}</td>
                    <td className="py-1">{row.planned_task_count}</td>
                    <td className="py-1">{row.completed_task_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-lg border border-border bg-surface p-4">
        <h3 className="mb-2 text-sm font-semibold text-text">Domain completions by week</h3>
        {data.domain_weekly_completions.length === 0 ? (
          <p className="text-sm text-text-muted">No completions</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {data.domain_weekly_completions.map((row) => (
              <li key={`${row.domain_id}-${row.week_start}`}>
                {row.week_start} — {row.domain_name}: {row.completed_task_count} completed
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
