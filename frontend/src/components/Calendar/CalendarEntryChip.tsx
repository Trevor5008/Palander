import type { MouseEventHandler } from "react";
import { EntryPill } from "../ui/EntryPill";
import type { DomainRead } from "../../types/api";

type CalendarEntryChipProps = {
  label: string;
  domainId: number | null | undefined;
  domains: DomainRead[];
  completed?: boolean;
  onClick: MouseEventHandler<HTMLButtonElement>;
};

export function CalendarEntryChip({
  label,
  domainId,
  domains,
  completed = false,
  onClick,
}: CalendarEntryChipProps) {
  return (
    <EntryPill
      label={label}
      domainId={domainId}
      domains={domains}
      completed={completed}
      onClick={onClick}
    />
  );
}