import { getDomainClassesById } from "../../constants/domainColors";
import type { DomainRead } from "../../types/api";

// Calendar Entry Chip component props
type CalendarEntryChipProps = {
  label: string;
  domainId: number | null | undefined;
  domains: DomainRead[];
  onClick: () => void;
};

// Calendar Entry Chip component
export function CalendarEntryChip({
  label,
  domainId,
  domains,
  onClick,
}: CalendarEntryChipProps) {
  const colors = getDomainClassesById(domainId, domains);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`block w-full truncate rounded px-1 text-left text-[10px] ${colors.chip}`}
    >
      {label}
    </button>
  );
}
