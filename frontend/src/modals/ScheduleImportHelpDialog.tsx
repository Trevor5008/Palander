import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import type { FormatIssueRead } from "../types/api";
import {
  SCHEDULE_HELP_SECTIONS,
  WEEKDAY_LETTER_HELP,
  type ScheduleHelpSection,
} from "../utils/scheduleImportHelp";

type ScheduleImportHelpDialogProps = {
  open: boolean;
  onClose: () => void;
  highlightSection?: ScheduleHelpSection;
  formatIssues?: FormatIssueRead[];
};

export function ScheduleImportHelpDialog({
  open,
  onClose,
  highlightSection = "plain",
  formatIssues = [],
}: ScheduleImportHelpDialogProps) {
  const sectionOrder: ScheduleHelpSection[] = ["plain", "weekdays", "csv", "term"];

  return (
    <Dialog open={open} onClose={onClose} className="relative z-[60]">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-lg border border-gray-200 bg-white p-5 shadow-xl">
          <div className="mb-3 flex items-start justify-between gap-4">
            <DialogTitle className="text-lg font-semibold">Schedule paste formats</DialogTitle>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close help"
              className="rounded p-1 text-gray-500 hover:bg-gray-100"
            >
              <XMarkIcon className="size-5" />
            </button>
          </div>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto text-sm">
            {formatIssues.length > 0 && (
              <div
                className="rounded-md border border-red-200 bg-red-50 p-3 text-red-900"
                role="alert"
              >
                <p className="mb-2 font-medium">Fix these format issues:</p>
                <ul className="list-inside list-disc space-y-1 text-xs">
                  {formatIssues.map((issue, index) => (
                    <li key={`${issue.line_number}-${issue.code}-${index}`}>
                      {issue.line_number > 0 && `Line ${issue.line_number}: `}
                      {issue.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {sectionOrder.map((key) => {
              const section = SCHEDULE_HELP_SECTIONS[key];
              const highlighted = key === highlightSection;
              return (
                <section
                  key={key}
                  id={`schedule-help-${key}`}
                  className={
                    highlighted
                      ? "rounded-md border border-blue-200 bg-blue-50/50 p-3"
                      : "p-1"
                  }
                >
                  <h3 className="mb-1 font-medium text-gray-900">{section.title}</h3>
                  {section.body.map((line) => (
                    <p key={line} className="text-gray-600">
                      {line}
                    </p>
                  ))}
                  {key === "weekdays" && (
                    <ul className="mt-2 grid grid-cols-2 gap-1 text-xs text-gray-700">
                      {WEEKDAY_LETTER_HELP.map((row) => (
                        <li key={row.letter}>
                          <span className="font-mono font-medium">{row.letter}</span> = {row.day}
                        </li>
                      ))}
                    </ul>
                  )}
                  {section.examples?.good && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-gray-500">Examples</p>
                      <ul className="mt-1 space-y-1 font-mono text-xs text-gray-800">
                        {section.examples.good.map((ex) => (
                          <li key={ex} className="rounded bg-gray-100 px-2 py-1">
                            {ex}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {section.examples?.bad && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-amber-700">Avoid</p>
                      <ul className="mt-1 space-y-1 font-mono text-xs text-amber-900">
                        {section.examples.bad.map((ex) => (
                          <li key={ex}>{ex}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
