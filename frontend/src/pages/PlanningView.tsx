import { useState } from "react";
import { PlanningObjectivesTab } from "../components/planning/PlanningObjectivesTab";
import { PlanningProgress } from "../components/planning/PlanningProgress";
import { PlanningWeeklyReview } from "../components/planning/PlanningWeeklyReview";
import { startOfWeek } from "../utils/date";

type PlanningTab = "objectives" | "weekly" | "progress";

export function PlanningView() {
  const [tab, setTab] = useState<PlanningTab>("objectives");
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <header>
        <h2 className="text-3xl text-text">Planning</h2>
        <p className="mt-1 text-sm text-text-muted">
          Objectives, weekly domain review, and progress history for your execution model.
        </p>
      </header>

      <nav className="flex gap-1 rounded-lg border border-border bg-bg p-1 text-sm">
        {(
          [
            ["objectives", "Objectives"],
            ["weekly", "Weekly review"],
            ["progress", "Progress"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`btn-chrome flex-1 rounded-md px-3 py-2 text-sm transition-colors ${
              tab === id ? "bg-surface text-text shadow-sm" : "text-text-muted hover:text-text"
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === "objectives" && <PlanningObjectivesTab />}
      {tab === "weekly" && (
        <PlanningWeeklyReview weekStart={weekStart} onWeekChange={setWeekStart} />
      )}
      {tab === "progress" && <PlanningProgress />}
    </section>
  );
}
