type WorkspaceHeaderProps = {
  dailyActive: boolean;
  eventTitle: string | null;
  onSelectDaily: () => void;
  onCloseEvent: () => void;
};

export function WorkspaceHeader({
  dailyActive,
  eventTitle,
  onSelectDaily,
  onCloseEvent,
}: WorkspaceHeaderProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 px-3 py-2">
      <button
        type="button"
        onClick={onSelectDaily}
        className={`rounded-md px-3 py-1.5 text-sm ${
          dailyActive
            ? "bg-gray-800 text-white"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
      >
        Daily Note
      </button>
      {eventTitle && !dailyActive && (
        <div className="flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-sm text-blue-900">
          <span className="max-w-[12rem] truncate font-medium">{eventTitle}</span>
          <button
            type="button"
            onClick={onCloseEvent}
            className="rounded p-0.5 text-blue-700 hover:bg-blue-100"
            aria-label="Close event note"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
