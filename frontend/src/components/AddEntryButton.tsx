type AddEntryButtonProps = {
  onClick: () => void;
  className?: string;
};

export function AddEntryButton({ onClick, className = "" }: AddEntryButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded border border-border px-3 py-1.5 text-sm font-medium text-text hover:bg-bg ${className}`}
    >
      Add +
    </button>
  );
}
