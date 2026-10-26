import { useState } from "react";
import { updateTask } from "../api";
import type { DailyWorkspaceRead, TaskRead } from "../types/api";
type DailyExecutionPaneProps = {
  workspace: DailyWorkspaceRead | null;
  loading: boolean;
  error: string | null;
  domainsById: Map<number, string>;
  objectivesById: Map<number, string>;
  onChanged: () => void;
};

function TaskRow({
  task,
  domainsById,
  objectivesById,
  onChanged,
  actions,
}: {
  task: TaskRead;
  domainsById: Map<number, string>;
  objectivesById: Map<number, string>;
  onChanged: () => void;
  actions: "active" | "completed";
}) {
  const [busy, setBusy] = useState(false);
  const [moveDate, setMoveDate] = useState(task.planned_for);

  const domainLabel = domainsById.get(task.domain_id) ?? "Domain";
  const objectiveLabel =
    task.objective_id != null ? objectivesById.get(task.objective_id) : null;

  async function patch(body: Parameters<typeof updateTask>[1]) {
    setBusy(true);
    try {
      await updateTask(task.id, body);
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
      <div className="font-medium text-gray-900">{task.name}</div>
      <div className="mt-1 flex flex-wrap gap-1 text-xs text-gray-600">
        <span className="rounded bg-white px-1.5 py-0.5">{domainLabel}</span>
        {objectiveLabel && (
          <span className="rounded bg-white px-1.5 py-0.5">{objectiveLabel}</span>
        )}
      </div>
      {actions === "active" && (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            disabled={busy}
            onClick={() => patch({ status: "completed" })}
            className="rounded bg-green-700 px-2 py-1 text-white hover:bg-green-600 disabled:opacity-50"
          >
            Complete
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => patch({ status: "cancelled" })}
            className="rounded border border-gray-300 px-2 py-1 hover:bg-white disabled:opacity-50"
          >
            Cancel
          </button>
          <label className="flex items-center gap-1">
            Move to
            <input
              type="date"
              value={moveDate}
              onChange={(e) => setMoveDate(e.target.value)}
              className="rounded border border-gray-300 px-1 py-0.5"
            />
            <button
              type="button"
              disabled={busy || moveDate === task.planned_for}
              onClick={() => patch({ planned_for: moveDate })}
              className="rounded border border-gray-300 px-2 py-1 hover:bg-white disabled:opacity-50"
            >
              Save
            </button>
          </label>
        </div>
      )}
      {actions === "completed" && (
        <div className="mt-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => patch({ status: "active" })}
            className="rounded border border-gray-300 px-2 py-1 text-xs hover:bg-white disabled:opacity-50"
          >
            Undo
          </button>
        </div>
      )}
    </li>
  );
}

function Section({
  title,
  empty,
  count,
  children,
}: {
  title: string;
  empty: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="min-h-0">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        {title}
      </h3>
      {count === 0 ? (
        <p className="text-sm text-gray-400">{empty}</p>
      ) : (
        <ul className="space-y-2">{children}</ul>
      )}
    </section>
  );
}

export function DailyExecutionPane({
  workspace,
  loading,
  error,
  domainsById,
  objectivesById,
  onChanged,
}: DailyExecutionPaneProps) {
  if (loading && !workspace) {
    return <p className="p-4 text-sm text-gray-500">Loading execution workspace…</p>;
  }
  if (error) {
    return (
      <p className="p-4 text-sm text-red-600" role="alert">
        {error}
      </p>
    );
  }
  if (!workspace) {
    return null;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-md border border-gray-200 p-3">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Domain coverage
          </h3>
          <ul className="space-y-1 text-xs text-gray-700">
            {workspace.domain_coverage.map((row) => (
              <li key={row.domain_id} className="flex justify-between gap-2">
                <span>{row.domain_name}</span>
                <span className="text-gray-500">
                  {row.scheduled_event_minutes}m · {row.planned_task_count} tasks
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-md border border-gray-200 p-3">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Objective activity
          </h3>
          {workspace.objective_activity.length === 0 ? (
            <p className="text-xs text-gray-400">No objective-linked tasks today</p>
          ) : (
            <ul className="space-y-1 text-xs text-gray-700">
              {workspace.objective_activity.map((row) => (
                <li key={row.objective_id} className="flex justify-between gap-2">
                  <span className="truncate">{row.objective_title}</span>
                  <span className="shrink-0 text-gray-500">
                    {row.completed_task_count}/{row.planned_task_count} done
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <Section title="Today" empty="Nothing planned for this day" count={workspace.today.length}>
        {workspace.today.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            domainsById={domainsById}
            objectivesById={objectivesById}
            onChanged={onChanged}
            actions="active"
          />
        ))}
      </Section>

      <Section title="Overdue" empty="No overdue tasks" count={workspace.overdue.length}>
        {workspace.overdue.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            domainsById={domainsById}
            objectivesById={objectivesById}
            onChanged={onChanged}
            actions="active"
          />
        ))}
      </Section>

      <Section
        title="Completed"
        empty="Nothing completed on this day"
        count={workspace.completed.length}
      >
        {workspace.completed.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            domainsById={domainsById}
            objectivesById={objectivesById}
            onChanged={onChanged}
            actions="completed"
          />
        ))}
      </Section>
    </div>
  );
}
