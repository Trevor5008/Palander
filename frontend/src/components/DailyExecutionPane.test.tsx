import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DailyExecutionPane } from "./DailyExecutionPane";
import type { DailyWorkspaceRead, TaskRead } from "../types/api";

const updateTaskMock = vi.fn();

vi.mock("../api", () => ({
  updateTask: (...args: unknown[]) => updateTaskMock(...args),
}));

function baseTask(overrides: Partial<TaskRead> & Pick<TaskRead, "id" | "name">): TaskRead {
  return {
    planned_for: "2026-10-28",
    due_at: "2026-10-28T12:00:00Z",
    status: "active",
    completed_at: null,
    is_recurring: false,
    rrule: null,
    timezone: null,
    recurrence_until: null,
    estimated_duration_minutes: 90,
    overdue_policy: "keep_overdue",
    user_id: 1,
    domain_id: 1,
    event_id: null,
    objective_ids: [1],
    series_id: null,
    occurrence_date: null,
    ...overrides,
  };
}

const workspaceFixture: DailyWorkspaceRead = {
  date: "2026-10-28",
  today: [
    baseTask({ id: 1, name: "Today standalone", planned_for: "2026-10-28" }),
  ],
  overdue: [
    baseTask({
      id: 42,
      name: "DSA practice",
      planned_for: "2026-10-06",
      due_at: "2026-10-06T12:00:00Z",
      is_recurring: true,
      rrule: "FREQ=DAILY",
      series_id: 42,
      occurrence_date: "2026-10-06",
    }),
  ],
  completed: [
    baseTask({
      id: 99,
      name: "Morning review",
      status: "completed",
      completed_at: "2026-10-28T14:00:00Z",
    }),
  ],
  domain_coverage: [],
  objective_activity: [],
};

function renderPane(onChanged = vi.fn()) {
  const domainsById = new Map([[1, "career"]]);
  const objectivesById = new Map([[1, "DSA fluency"]]);
  render(
    <DailyExecutionPane
      workspace={workspaceFixture}
      loading={false}
      error={null}
      domainsById={domainsById}
      objectivesById={objectivesById}
      onChanged={onChanged}
    />,
  );
  return { onChanged };
}

describe("DailyExecutionPane", () => {
  beforeEach(() => {
    updateTaskMock.mockReset();
    updateTaskMock.mockResolvedValue({});
  });

  afterEach(() => {
    cleanup();
  });

  it("renders Today, Overdue, and Completed today sections from workspace data", () => {
    renderPane();
    expect(screen.getByRole("heading", { name: /today/i })).toBeInTheDocument();
    expect(screen.getByText("Today standalone")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /overdue \(1\)/i })).toBeInTheDocument();
    expect(screen.getByText("DSA practice")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /completed today \(1\)/i })).toBeInTheDocument();
  });

  it("completing a recurring overdue occurrence sends occurrence-scoped PATCH and refreshes", async () => {
    const user = userEvent.setup();
    const { onChanged } = renderPane();

    const overdueRow = screen.getByText("DSA practice").closest("li");
    expect(overdueRow).not.toBeNull();
    await user.click(within(overdueRow!).getByRole("button", { name: "Complete" }));

    expect(updateTaskMock).toHaveBeenCalledTimes(1);
    expect(updateTaskMock).toHaveBeenCalledWith(
      42,
      { status: "completed" },
      { scope: "occurrence", occurrence_date: "2026-10-06" },
    );
    expect(onChanged).toHaveBeenCalledTimes(1);
  });

  it("completing a non-recurring today task omits recurrence scope", async () => {
    const user = userEvent.setup();
    renderPane();

    const todayRow = screen.getByText("Today standalone").closest("li");
    expect(todayRow).not.toBeNull();
    await user.click(within(todayRow!).getByRole("button", { name: "Complete" }));

    expect(updateTaskMock).toHaveBeenCalledWith(1, { status: "completed" }, undefined);
  });
});