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
        <h2 className="text-2xl font-semibold text-gray-900">Planning</h2>
        <p className="mt-1 text-sm text-gray-600">
          Objectives, weekly domain review, and progress history for your execution model.
        </p>
      </header>

      <nav className="flex gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1 text-sm">
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
            className={`flex-1 rounded-md px-3 py-2 font-medium transition-colors ${
              tab === id ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
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
