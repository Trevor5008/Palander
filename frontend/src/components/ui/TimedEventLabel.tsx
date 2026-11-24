import { domainDotClassById } from "../../constants/domainColors";
import type { DomainRead } from "../../types/api";

type TimedEventLabelProps = {
  time: string;
  title: string;
  domainId: number | null | undefined;
  domains: DomainRead[];
  completed?: boolean;
};

export function TimedEventLabel({
  time,
  title,
  domainId,
  domains,
  completed = false,
}: TimedEventLabelProps) {
  const dot = domainDotClassById(domainId, domains);
  return (
    <span
      className={`inline-flex min-w-0 max-w-full items-center gap-1.5 font-sans text-[11px] leading-tight ${completed ? "opacity-45 line-through" : ""}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} aria-hidden />
      <span className="shrink-0 font-medium tabular-nums">{time}</span>
      <span className="min-w-0 truncate">{title}</span>
    </span>
  );
}