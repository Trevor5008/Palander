import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { InformationCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { importSchedule, parseSchedule } from "../api";
import { DOMAINS } from "../constants/domains";
import type {
  DomainRead,
  FormatIssueRead,
  ImportCandidateRead,
  ScheduleFormatHint,
  ScheduleImportResult,
} from "../types/api";
import { ScheduleImportHelpDialog } from "./ScheduleImportHelpDialog";
import type { ScheduleHelpSection } from "../utils/scheduleImportHelp";
import { toApiDateTime } from "../utils/apiMappers";
import {
  formatDateForInput,
  formatTimeForInput,
  parseDateInput,
} from "../utils/date";
import {
  defaultTermEnd,
  defaultTermStart,
  defaultTimezone,
  WEEKDAY_CODES,
  WEEKDAY_LABELS,
  type WeekdayCode,
} from "../utils/recurrence";

type ScheduleImportModalProps = {
  open: boolean;
  onClose: () => void;
  domains: DomainRead[];
  onImported: () => void;
};

function repeatUntilIso(termEnd: string): string {
  const date = parseDateInput(termEnd);
  date.setHours(23, 59, 0, 0);
  return toApiDateTime(date);
}

function recurrenceSummary(weekdays: string[], termEnd: string): string {
  const days = weekdays
    .map((d) => WEEKDAY_LABELS[d as WeekdayCode] ?? d)
    .join(", ");
  return `Every week on ${days} until ${termEnd}`;
}

export function ScheduleImportModal({
  open,
  onClose,
  domains,
  onImported,
}: ScheduleImportModalProps) {
  const year = new Date().getFullYear();
  const [text, setText] = useState("");
  const [defaultYear, setDefaultYear] = useState(year);
  const [termStart, setTermStart] = useState(defaultTermStart(year));
  const [termEnd, setTermEnd] = useState(defaultTermEnd(year));
  const [timezone, setTimezone] = useState(defaultTimezone());
  const [formatHint, setFormatHint] = useState<ScheduleFormatHint>("auto");
  const [candidates, setCandidates] = useState<ImportCandidateRead[]>([]);
  const [result, setResult] = useState<ScheduleImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [formatIssues, setFormatIssues] = useState<FormatIssueRead[]>([]);
  const [helpOpen, setHelpOpen] = useState(false);
  const [helpSection, setHelpSection] = useState<ScheduleHelpSection>("plain");

  const resetImportForm = (clearResult = false) => {
    setText("");
    setCandidates([]);
    setFormatIssues([]);
    setError(null);
    if (clearResult) {
      setResult(null);
    }
  };

  useEffect(() => {
    if (!open) {
      resetImportForm(true);
      const y = new Date().getFullYear();
      setDefaultYear(y);
      setTermStart(defaultTermStart(y));
      setTermEnd(defaultTermEnd(y));
      setTimezone(defaultTimezone());
      setFormatHint("auto");
    }
  }, [open]);

  const updateCandidate = (clientKey: string, patch: Partial<ImportCandidateRead>) => {
    setCandidates((rows) =>
      rows.map((row) => (row.client_key === clientKey ? { ...row, ...patch } : row)),
    );
  };

  const toggleWeekday = (clientKey: string, code: WeekdayCode, current: string[]) => {
    const set = new Set(current);
    if (set.has(code)) {
      set.delete(code);
    } else {
      set.add(code);
    }
    updateCandidate(clientKey, { weekdays: Array.from(set) as WeekdayCode[] });
  };

  const handleParse = async () => {
    if (!text.trim()) {
      setError("Paste schedule text first");
      return;
    }
    if (termEnd < termStart) {
      setError("Repeat until must be on or after term start");
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
        term_start: termStart,
        term_end: termEnd,
        format_hint: formatHint,
      });
      const until = repeatUntilIso(termEnd);
      const withDomains = response.candidates.map((candidate) => ({
        ...candidate,
        recurrence_until: until,
        domain_id: candidate.domain_id ?? domains[0]?.id ?? null,
      }));
      const issues = response.format_issues ?? [];
      setFormatIssues(issues);
      setCandidates(withDomains);
      if (issues.length > 0) {
        const section = (issues[0]?.help_section as ScheduleHelpSection) ?? "plain";
        setHelpSection(
          section === "csv" || section === "term" || section === "weekdays" ? section : "plain",
        );
        setHelpOpen(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Parse failed");
    } finally {
      setBusy(false);
    }
  };

  const validateSelected = (selected: ImportCandidateRead[]): string | null => {
    for (const candidate of selected) {
      if (candidate.weekdays.length === 0) {
        return `"${candidate.title}" needs at least one weekday`;
      }
      if (new Date(candidate.end_at) <= new Date(candidate.start_at)) {
        return `"${candidate.title}" end time must be after start time`;
      }
    }
    return null;
  };

  const handleImport = async () => {
    const selected = candidates.filter((candidate) => candidate.included);
    if (selected.length === 0) {
      setError("Select at least one candidate to import");
      return;
    }
    const validationError = validateSelected(selected);
    if (validationError) {
      setError(validationError);
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
          recurrence_until: repeatUntilIso(termEnd),
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
            <div className="flex items-center gap-2">
              <DialogTitle className="text-lg font-semibold">Import schedule</DialogTitle>
              <button
                type="button"
                onClick={() => {
                  setHelpSection(formatHint === "csv" ? "csv" : "plain");
                  setHelpOpen(true);
                }}
                aria-label="Schedule paste format help"
                className="rounded p-1 text-gray-500 hover:bg-gray-100"
              >
                <InformationCircleIcon className="size-5" />
              </button>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded p-1 text-gray-500 hover:bg-gray-100"
            >
              <XMarkIcon className="size-5" />
            </button>
          </div>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto text-sm">
            {formatIssues.length > 0 && (
              <div
                className="rounded-md border border-red-300 bg-red-50 p-3 text-red-900"
                role="alert"
              >
                <p className="mb-1 font-medium">Invalid schedule format</p>
                <ul className="list-inside list-disc space-y-1 text-xs">
                  {formatIssues.map((issue, index) => (
                    <li key={`${issue.line_number}-${issue.code}-${index}`}>
                      {issue.line_number > 0 && `Line ${issue.line_number}: `}
                      {issue.message}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  className="mt-2 text-xs font-medium text-red-800 underline"
                  onClick={() => setHelpOpen(true)}
                >
                  View format instructions
                </button>
              </div>
            )}
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. Chemistry Lab M W 0900 1145 or Mon Wed 09:00 10:30"
              className={`h-32 w-full rounded-md border px-3 py-2 ${
                formatIssues.length > 0
                  ? "border-red-400 bg-red-50/30 focus:border-red-500"
                  : "border-gray-300"
              }`}
              aria-invalid={formatIssues.length > 0}
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
                <label className="mb-1 block text-gray-500">Format</label>
                <select
                  value={formatHint}
                  onChange={(e) => setFormatHint(e.target.value as ScheduleFormatHint)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="auto">Auto</option>
                  <option value="plain">Plain lines</option>
                  <option value="csv">CSV / TSV</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-gray-500">Term starts</label>
                <input
                  type="date"
                  value={termStart}
                  onChange={(e) => setTermStart(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block text-gray-500">Repeat until</label>
                <input
                  type="date"
                  value={termEnd}
                  onChange={(e) => setTermEnd(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                />
                {candidates.length > 0 && (
                  <p className="mt-1 text-xs text-gray-500">
                    All series use this end date on import.
                  </p>
                )}
              </div>
              <div className="col-span-2">
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
                {candidates.map((candidate) => {
                  const start = new Date(candidate.start_at);
                  const end = new Date(candidate.end_at);
                  return (
                    <div key={candidate.client_key} className="rounded-md border border-gray-200 p-3">
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={candidate.included}
                            onChange={(e) =>
                              updateCandidate(candidate.client_key, {
                                included: e.target.checked,
                              })
                            }
                          />
                          Include
                        </label>
                        <span className="text-xs text-gray-500">
                          Confidence {(candidate.confidence * 100).toFixed(0)}%
                        </span>
                        {candidate.duplicate_of_event_id && (
                          <span className="text-xs text-amber-700">
                            Possible duplicate #{candidate.duplicate_of_event_id}
                          </span>
                        )}
                      </div>
                      <input
                        value={candidate.title}
                        onChange={(e) =>
                          updateCandidate(candidate.client_key, { title: e.target.value })
                        }
                        className="mb-2 w-full rounded-md border border-gray-300 px-2 py-1"
                      />
                      <div className="mb-2 flex flex-wrap gap-2">
                        {WEEKDAY_CODES.map((code) => (
                          <label key={code} className="flex items-center gap-1 text-xs">
                            <input
                              type="checkbox"
                              checked={candidate.weekdays.includes(code)}
                              onChange={() =>
                                toggleWeekday(
                                  candidate.client_key,
                                  code,
                                  candidate.weekdays,
                                )
                              }
                            />
                            {WEEKDAY_LABELS[code]}
                          </label>
                        ))}
                      </div>
                      <div className="mb-2 grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-gray-500">Start time</label>
                          <input
                            type="time"
                            value={formatTimeForInput(start)}
                            onChange={(e) => {
                              const [h, m] = e.target.value.split(":").map(Number);
                              const next = new Date(start);
                              next.setHours(h, m, 0, 0);
                              updateCandidate(candidate.client_key, {
                                start_at: toApiDateTime(next),
                              });
                            }}
                            className="w-full rounded-md border border-gray-300 px-2 py-1"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">End time</label>
                          <input
                            type="time"
                            value={formatTimeForInput(end)}
                            onChange={(e) => {
                              const [h, m] = e.target.value.split(":").map(Number);
                              const next = new Date(end);
                              next.setHours(h, m, 0, 0);
                              updateCandidate(candidate.client_key, {
                                end_at: toApiDateTime(next),
                              });
                            }}
                            className="w-full rounded-md border border-gray-300 px-2 py-1"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-600">
                        {recurrenceSummary(candidate.weekdays, termEnd)}
                      </p>
                      <p className="text-xs text-gray-500">
                        First occurrence {formatDateForInput(start)}
                      </p>
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
                  );
                })}
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
                Imported {result.imported}, skipped {result.skipped}, duplicates{" "}
                {result.duplicate}, unresolved {result.unresolved}
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

      <ScheduleImportHelpDialog
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        highlightSection={helpSection}
        formatIssues={formatIssues}
      />
    </Dialog>
  );
}
