import { useMemo, useState } from "react";
import { createObjective, deleteObjective, updateObjective } from "../../api";
import { useDomains } from "../../hooks/useDomains";
import { useObjectives } from "../../hooks/useObjectives";
import type { ObjectiveRead, ObjectiveStatus } from "../../types/api";

const STATUSES: ObjectiveStatus[] = ["active", "paused", "completed", "cancelled"];

export function PlanningObjectivesTab() {
  const domains = useDomains();
  const [showCancelled, setShowCancelled] = useState(false);
  const { objectives, loading, error, reload } = useObjectives();
  const [draftTitle, setDraftTitle] = useState("");
  const [draftTargetDate, setDraftTargetDate] = useState("");
  const [draftDomainId, setDraftDomainId] = useState<number | "">("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const visibleObjectives = useMemo(
    () =>
      showCancelled ? objectives : objectives.filter((o) => o.status !== "cancelled"),
    [objectives, showCancelled],
  );

  const byDomain = useMemo(() => {
    const map = new Map<number, ObjectiveRead[]>();
    for (const domain of domains) {
      map.set(domain.id, visibleObjectives.filter((o) => o.domain_id === domain.id));
    }
    return map;
  }, [domains, visibleObjectives]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!draftTitle.trim() || draftDomainId === "") {
      setFormError("Title and domain are required");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      await createObjective({
        title: draftTitle.trim(),
        domain_id: draftDomainId,
        target_date: draftTargetDate ? `${draftTargetDate}T00:00:00` : null,
      });
      setDraftTitle("");
      setDraftTargetDate("");
      await reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(objective: ObjectiveRead, status: ObjectiveStatus) {
    await updateObjective(objective.id, { status });
    await reload();
  }

  async function changeTitle(objective: ObjectiveRead, title: string) {
    const trimmed = title.trim();
    if (!trimmed || trimmed === objective.title) return;
    await updateObjective(objective.id, { title: trimmed });
    await reload();
  }

  async function changeTargetDate(objective: ObjectiveRead, value: string) {
    const iso = value ? `${value}T00:00:00` : null;
    const current = objective.target_date?.slice(0, 10) ?? "";
    if (value === current) return;
    await updateObjective(objective.id, { target_date: iso });
    await reload();
  }

  async function remove(objective: ObjectiveRead) {
    if (!window.confirm(`Delete objective "${objective.title}"?`)) return;
    await deleteObjective(objective.id);
    await reload();
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleCreate}
        className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4"
      >
        <div className="min-w-[12rem] flex-1">
          <label htmlFor="obj-title" className="mb-1 block text-xs text-gray-500">
            New objective
          </label>
          <input
            id="obj-title"
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            placeholder="Outcome or mission"
          />
        </div>
        <div>
          <label htmlFor="obj-target" className="mb-1 block text-xs text-gray-500">
            Target date
          </label>
          <input
            id="obj-target"
            type="date"
            value={draftTargetDate}
            onChange={(e) => setDraftTargetDate(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="obj-domain" className="mb-1 block text-xs text-gray-500">
            Domain
          </label>
          <select
            id="obj-domain"
            value={draftDomainId}
            onChange={(e) =>
              setDraftDomainId(e.target.value ? Number(e.target.value) : "")
            }
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">Select…</option>
            {domains.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
        >
          Add
        </button>
        {formError && (
          <p className="w-full text-sm text-red-600" role="alert">
            {formError}
          </p>
        )}
      </form>

      <label className="flex items-center gap-2 text-sm text-gray-600">
        <input
          type="checkbox"
          checked={showCancelled}
          onChange={(e) => setShowCancelled(e.target.checked)}
        />
        Show cancelled
      </label>

      {loading && <p className="text-sm text-gray-500">Loading objectives…</p>}
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <div className="space-y-6">
        {domains.map((domain) => {
          const rows = byDomain.get(domain.id) ?? [];
          return (
            <div key={domain.id} className="rounded-lg border border-gray-200 bg-white p-4">
              <h3 className="mb-3 text-lg font-medium capitalize text-gray-900">
                {domain.name}
              </h3>
              {rows.length === 0 ? (
                <p className="text-sm text-gray-400">No objectives in this domain</p>
              ) : (
                <ul className="space-y-3">
                  {rows.map((objective) => (
                    <li
                      key={objective.id}
                      className="flex flex-wrap items-center gap-2 border-b border-gray-100 pb-3 last:border-0 last:pb-0"
                    >
                      <input
                        defaultValue={objective.title}
                        onBlur={(e) => changeTitle(objective, e.target.value)}
                        className="min-w-[8rem] flex-1 rounded border border-transparent px-2 py-1 text-sm hover:border-gray-200 focus:border-gray-300 focus:outline-none"
                      />
                      <input
                        type="date"
                        defaultValue={objective.target_date?.slice(0, 10) ?? ""}
                        onBlur={(e) => changeTargetDate(objective, e.target.value)}
                        className="rounded border border-gray-300 px-2 py-1 text-xs"
                        aria-label="Target date"
                      />
                      <select
                        value={objective.status}
                        onChange={(e) =>
                          changeStatus(objective, e.target.value as ObjectiveStatus)
                        }
                        className="rounded-md border border-gray-300 px-2 py-1 text-xs capitalize"
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => remove(objective)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
