import type { MouseEventHandler, ReactNode } from "react";
import { COMPLETED_ENTRY_CLASSES, getDomainClassesById } from "../../constants/domainColors";
import type { DomainRead } from "../../types/api";

type EntryPillProps = {
  label: ReactNode;
  domainId: number | null | undefined;
  domains: DomainRead[];
  completed?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  className?: string;
  as?: "button" | "span";
};

export function EntryPill({
  label,
  domainId,
  domains,
  completed = false,
  onClick,
  className = "",
  as = "button",
}: EntryPillProps) {
  const colors = getDomainClassesById(domainId, domains);
  const state = completed ? COMPLETED_ENTRY_CLASSES : "";
  const shared = `block w-full px-1 py-0.5 text-left ${colors.chip} ${state} ${className}`;

  if (as === "span" || !onClick) {
    return <span className={shared}>{label}</span>;
  }

  return (
    <button type="button" onClick={onClick} className={shared}>
      {label}
    </button>
  );
}