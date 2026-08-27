import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import type { ReactNode } from "react";

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
    <div className="grid grid-cols-3 items-center border-b border-gray-200 px-4 py-3">
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label={prevLabel}
          onClick={onPrev}
          className="rounded p-1.5 text-gray-600 hover:bg-gray-100"
        >
          <ChevronLeftIcon className="size-5" />
        </button>
        <button
          type="button"
          aria-label={nextLabel}
          onClick={onNext}
          className="rounded p-1.5 text-gray-600 hover:bg-gray-100"
        >
          <ChevronRightIcon className="size-5" />
        </button>
        <button
          type="button"
          onClick={onToday}
          className="ml-1 rounded border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50"
        >
          today
        </button>
      </div>

      {center ?? <h2 className="text-center text-lg font-semibold">{label}</h2>}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onAdd}
          className="rounded border border-gray-300 p-1.5 text-sm text-gray-600 hover:bg-gray-100"
        >
          add +
        </button>
      </div>
    </div>
  );
}
