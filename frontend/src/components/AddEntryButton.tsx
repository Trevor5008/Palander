type AddEntryButtonProps = {
  onClick: () => void;
  className?: string;
};

export function AddEntryButton({ onClick, className = "" }: AddEntryButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 ${className}`}
    >
      Add +
    </button>
  );
}
