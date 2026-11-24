import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import type { ReactNode } from "react";
import { AddEntryButton } from "./AddEntryButton";

type DateNavBarProps = {
  label: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onAdd: () => void;
  prevLabel?: string;
  nextLabel?: string;
  center?: ReactNode;
};

export function DateNavBar({
  label,
  onPrev,
  onNext,
  onToday,
  onAdd,
  prevLabel = "Previous",
  nextLabel = "Next",
  center,
}: DateNavBarProps) {
  return (
    <div className="grid grid-cols-3 items-center border-b border-border px-4 py-3">
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label={prevLabel}
          onClick={onPrev}
          className="rounded p-1.5 text-text-muted hover:bg-surface"
        >
          <ChevronLeftIcon className="size-5" />
        </button>
        <button
          type="button"
          aria-label={nextLabel}
          onClick={onNext}
          className="rounded p-1.5 text-text-muted hover:bg-surface"
        >
          <ChevronRightIcon className="size-5" />
        </button>
        <button
          type="button"
          onClick={onToday}
          className="font-display ml-1 rounded border border-border px-3 py-1 text-sm text-today hover:bg-bg"
        >
          Today
        </button>
      </div>

      {center ?? <h2 className="font-display text-center text-base text-text">{label}</h2>}

      <div className="flex justify-end">
        <AddEntryButton onClick={onAdd} />
      </div>
    </div>
  );
}
