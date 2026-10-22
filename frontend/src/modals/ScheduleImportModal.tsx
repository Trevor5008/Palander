import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { importSchedule, parseSchedule } from "../api";
import { DOMAINS } from "../constants/domains";
import type { DomainRead, ImportCandidateRead, ScheduleImportResult } from "../types/api";
import { defaultTimezone } from "../utils/recurrence";

type ScheduleImportModalProps = {
  open: boolean;
  onClose: () => void;
  domains: DomainRead[];
  onImported: () => void;
};

export function ScheduleImportModal({
  open,
  onClose,
  domains,
  onImported,
}: ScheduleImportModalProps) {
  const [text, setText] = useState("");
  const [defaultYear, setDefaultYear] = useState(new Date().getFullYear());
  const [timezone, setTimezone] = useState(defaultTimezone());
  const [candidates, setCandidates] = useState<ImportCandidateRead[]>([]);
  const [result, setResult] = useState<ScheduleImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const resetImportForm = (clearResult = false) => {
    setText("");
    setCandidates([]);
    setError(null);
    if (clearResult) {
      setResult(null);
    }
  };

  useEffect(() => {
    if (!open) {
      resetImportForm(true);
      setDefaultYear(new Date().getFullYear());
      setTimezone(defaultTimezone());
    }
  }, [open]);

  const updateCandidate = (clientKey: string, patch: Partial<ImportCandidateRead>) => {
    setCandidates((rows) =>
      rows.map((row) => (row.client_key === clientKey ? { ...row, ...patch } : row)),
    );
  };

  const handleParse = async () => {
    if (!text.trim()) {
      setError("Paste schedule text first");
      return;
    }
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const response = await parseSchedule({
        text,
        default_year: defaultYear,
        timezone,
      });
      const withDomains = response.candidates.map((candidate) => ({
        ...candidate,
        domain_id: candidate.domain_id ?? domains[0]?.id ?? null,
      }));
      setCandidates(withDomains);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Parse failed");
    } finally {
      setBusy(false);
    }
  };

  const handleImport = async () => {
    const selected = candidates.filter((candidate) => candidate.included);
    if (selected.length === 0) {
      setError("Select at least one candidate to import");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const importResult = await importSchedule({
        candidates: selected.map((candidate) => ({
          client_key: candidate.client_key,
          title: candidate.title,
          start_at: candidate.start_at,
          end_at: candidate.end_at,
          weekdays: candidate.weekdays,
          recurrence_until: candidate.recurrence_until,
          timezone: candidate.timezone,
          domain_id: candidate.domain_id ?? domains[0].id,
          included: true,
        })),
      });
      setResult(importResult);
      onImported();
      resetImportForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-lg border border-gray-200 bg-white p-5 shadow-xl">
          <div className="mb-4 flex items-start justify-between gap-4">
            <DialogTitle className="text-lg font-semibold">Import schedule</DialogTitle>
            <button type="button" onClick={onClose} aria-label="Close" className="rounded p-1 text-gray-500 hover:bg-gray-100">
              <XMarkIcon className="size-5" />
            </button>
          </div>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto text-sm">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste schedule text (e.g. Chemistry Lab Mon,Wed 09:00-10:30)"
              className="h-32 w-full rounded-md border border-gray-300 px-3 py-2"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-gray-500">Default year</label>
                <input
                  type="number"
                  value={defaultYear}
                  onChange={(e) => setDefaultYear(Number(e.target.value))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block text-gray-500">Timezone</label>
                <input
                  type="text"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={handleParse}
              className="rounded-md bg-gray-800 px-4 py-2 text-white disabled:opacity-50"
            >
              {busy ? "Working…" : "Extract candidates"}
            </button>

            {candidates.length > 0 && (
              <div className="space-y-2">
                {candidates.map((candidate) => (
                  <div key={candidate.client_key} className="rounded-md border border-gray-200 p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={candidate.included}
                          onChange={(e) =>
                            updateCandidate(candidate.client_key, { included: e.target.checked })
                          }
                        />
                        Include
                      </label>
                      {candidate.duplicate_of_event_id && (
                        <span className="text-xs text-amber-700">
                          Possible duplicate #{candidate.duplicate_of_event_id}
                        </span>
                      )}
                    </div>
                    <input
                      value={candidate.title}
                      onChange={(e) => updateCandidate(candidate.client_key, { title: e.target.value })}
                      className="mb-2 w-full rounded-md border border-gray-300 px-2 py-1"
                    />
                    <p className="text-xs text-gray-600">{candidate.rrule_human}</p>
                    <p className="text-xs text-gray-500">{candidate.source_snippet}</p>
                    {candidate.warnings.length > 0 && (
                      <p className="text-xs text-amber-700">{candidate.warnings.join("; ")}</p>
                    )}
                    <select
                      value={candidate.domain_id ?? ""}
                      onChange={(e) =>
                        updateCandidate(candidate.client_key, {
                          domain_id: Number(e.target.value),
                        })
                      }
                      className="mt-2 w-full rounded-md border border-gray-300 px-2 py-1"
                    >
                      {DOMAINS.map((name) => {
                        const domain = domains.find((item) => item.name === name);
                        if (!domain) return null;
                        return (
                          <option key={domain.id} value={domain.id}>
                            {name}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                ))}
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleImport}
                  className="rounded-md bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
                >
                  Import selected
                </button>
              </div>
            )}

            {result && (
              <p className="text-sm text-gray-700">
                Imported {result.imported}, skipped {result.skipped}, duplicates {result.duplicate},
                unresolved {result.unresolved}
              </p>
            )}
            {error && (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
