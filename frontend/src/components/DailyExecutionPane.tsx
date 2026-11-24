import { useEffect, useState } from "react";
import { updateTask, type TaskMutationOptions } from "../api";
import type { DailyWorkspaceRead, TaskRead } from "../types/api";

const OVERDUE_PAGE_SIZE = 10;

type DailyExecutionPaneProps = {
  workspace: DailyWorkspaceRead | null;
  loading: boolean;
  error: string | null;
  domainsById: Map<number, string>;
  objectivesById: Map<number, string>;
  onChanged: () => void;
};

function taskMutationOptions(task: TaskRead): TaskMutationOptions | undefined {
  if (task.occurrence_date) {
    return { scope: "occurrence", occurrence_date: task.occurrence_date };
  }
  return undefined;
}

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
  const objectiveLabels = (task.objective_ids ?? [])
    .map((id) => objectivesById.get(id))
    .filter(Boolean);

  async function patch(body: Parameters<typeof updateTask>[1]) {
    setBusy(true);
    try {
      await updateTask(task.id, body, taskMutationOptions(task));
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  const completedStyle = actions === "completed" ? "opacity-45 line-through" : "";

  return (
    <li className={`rounded-md border border-border bg-surface px-3 py-2 text-sm ${completedStyle}`}>
      <div className="font-medium text-text">{task.name}</div>
      <div className="mt-1 flex flex-wrap gap-1 text-xs text-text-muted">
        <span className="rounded bg-surface px-1.5 py-0.5">{domainLabel}</span>
        {objectiveLabels.map((label) => (
          <span key={label} className="rounded bg-surface px-1.5 py-0.5">
            {label}
          </span>
        ))}
        {task.estimated_duration_minutes != null && task.estimated_duration_minutes > 0 && (
          <span className="rounded bg-surface px-1.5 py-0.5">{task.estimated_duration_minutes}m est.</span>
        )}
      </div>
      {actions === "active" && (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            disabled={busy}
            onClick={() => patch({ status: "completed" })}
            className="rounded bg-today px-2 py-1 text-bg hover:brightness-110 disabled:opacity-50"
          >
            Complete
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => patch({ status: "cancelled" })}
            className="rounded border border-border px-2 py-1 hover:bg-surface disabled:opacity-50"
          >
            Cancel
          </button>
          <label className="flex items-center gap-1">
            Move to
            <input
              type="date"
              value={moveDate}
              onChange={(e) => setMoveDate(e.target.value)}
              className="rounded border border-border px-1 py-0.5"
            />
            <button
              type="button"
              disabled={busy || moveDate === task.planned_for}
              onClick={() => patch({ planned_for: moveDate })}
              className="rounded border border-border px-2 py-1 hover:bg-surface disabled:opacity-50"
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
            className="rounded border border-border px-2 py-1 text-xs hover:bg-surface disabled:opacity-50"
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
    <section className="shrink-0">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
        {title}
      </h3>
      {count === 0 ? (
        <p className="text-sm text-text-muted">{empty}</p>
      ) : (
        <ul className="space-y-2">{children}</ul>
      )}
    </section>
  );
}

function CollapsibleCompletedSection({
  count,
  open,
  onToggle,
  children,
}: {
  count: number;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="shrink-0">
      <button
        type="button"
        onClick={onToggle}
        className="mb-2 flex w-full items-center justify-between text-left text-xs font-semibold uppercase tracking-wide text-text-muted hover:text-text"
        aria-expanded={open}
      >
        <span>Completed today ({count})</span>
        <span className="normal-case tracking-normal">{open ? "Hide" : "Show"}</span>
      </button>
      {count === 0 ? (
        <p className="text-sm text-text-muted">Nothing completed on this day</p>
      ) : open ? (
        <ul className="max-h-48 space-y-2 overflow-y-auto">{children}</ul>
      ) : null}
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
  const [completedOpen, setCompletedOpen] = useState(false);
  const [overdueVisibleCount, setOverdueVisibleCount] = useState(OVERDUE_PAGE_SIZE);

  useEffect(() => {
    setOverdueVisibleCount(OVERDUE_PAGE_SIZE);
    setCompletedOpen(false);
  }, [workspace?.date]);

  if (loading && !workspace) {
    return <p className="p-4 text-sm text-text-muted">Loading execution workspace…</p>;
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

  const overdueTotal = workspace.overdue.length;
  const overdueVisible = workspace.overdue.slice(0, overdueVisibleCount);
  const overdueRemaining = overdueTotal - overdueVisible.length;

  return (
    <div className="h-full min-h-0 overflow-y-auto">
      <div className="space-y-4 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-md border border-border p-3">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
            Domain coverage
          </h3>
          <ul className="space-y-1 text-xs text-text">
            {workspace.domain_coverage.map((row) => (
              <li key={row.domain_id} className="flex justify-between gap-2">
                <span>{row.domain_name}</span>
                <span className="text-text-muted">
                  {row.scheduled_event_minutes}m events · {row.planned_task_count} tasks
                  {row.planned_task_minutes > 0 ? ` · ${row.planned_task_minutes}m est.` : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-md border border-border p-3">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
            Objective activity
          </h3>
          {workspace.objective_activity.length === 0 ? (
            <p className="text-xs text-text-muted">No objective-linked work today</p>
          ) : (
            <ul className="space-y-1 text-xs text-text">
              {workspace.objective_activity.map((row) => (
                <li key={row.objective_id} className="flex flex-col gap-0.5">
                  <div className="flex justify-between gap-2">
                    <span className="truncate">{row.objective_title}</span>
                    <span className="shrink-0 text-text-muted">
                      {row.completed_task_count}/{row.planned_task_count} tasks
                    </span>
                  </div>
                  {row.scheduled_event_count > 0 && (
                    <span className="text-text-muted">
                      {row.scheduled_event_count} events · {row.scheduled_event_minutes}m scheduled
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <Section title="Today" empty="Nothing planned for this day" count={workspace.today.length}>
        {workspace.today.map((task) => (
          <TaskRow
            key={`${task.id}-${task.occurrence_date ?? task.planned_for}`}
            task={task}
            domainsById={domainsById}
            objectivesById={objectivesById}
            onChanged={onChanged}
            actions="active"
          />
        ))}
      </Section>

      <section className="shrink-0">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
          Overdue
          {overdueTotal > 0 ? ` (${overdueTotal})` : ""}
        </h3>
        {overdueTotal === 0 ? (
          <p className="text-sm text-text-muted">No overdue tasks</p>
        ) : (
          <>
            <ul className="space-y-2">
              {overdueVisible.map((task) => (
                <TaskRow
                  key={`${task.id}-${task.occurrence_date ?? task.planned_for}-od`}
                  task={task}
                  domainsById={domainsById}
                  objectivesById={objectivesById}
                  onChanged={onChanged}
                  actions="active"
                />
              ))}
            </ul>
            {overdueRemaining > 0 && (
              <button
                type="button"
                className="mt-2 text-sm text-text-muted underline hover:text-text"
                onClick={() =>
                  setOverdueVisibleCount((n) =>
                    Math.min(n + OVERDUE_PAGE_SIZE, overdueTotal),
                  )
                }
              >
                Show {Math.min(overdueRemaining, OVERDUE_PAGE_SIZE)} more (
                {overdueRemaining} remaining)
              </button>
            )}
          </>
        )}
      </section>

      <CollapsibleCompletedSection
        count={workspace.completed.length}
        open={completedOpen}
        onToggle={() => setCompletedOpen((v) => !v)}
      >
        {workspace.completed.map((task) => (
          <TaskRow
            key={`${task.id}-${task.occurrence_date ?? task.planned_for}-done`}
            task={task}
            domainsById={domainsById}
            objectivesById={objectivesById}
            onChanged={onChanged}
            actions="completed"
          />
        ))}
      </CollapsibleCompletedSection>
      </div>
    </div>
  );
}
