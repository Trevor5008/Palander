export type DomainColorClasses = {
  chip: string;
  block: string;
};

const PILL_BASE =
  "font-sans truncate rounded-sm border-l-[3px] text-[11px] leading-tight transition-[filter] hover:brightness-110";

const DOMAIN_COLORS: Record<string, DomainColorClasses> = {
  career: {
    chip: `${PILL_BASE} border-l-domain-career-accent bg-domain-career-fill text-domain-career-text`,
    block: `${PILL_BASE} border border-border border-l-domain-career-accent bg-domain-career-fill text-domain-career-text`,
  },
  fitness: {
    chip: `${PILL_BASE} border-l-domain-fitness-accent bg-domain-fitness-fill text-domain-fitness-text`,
    block: `${PILL_BASE} border border-border border-l-domain-fitness-accent bg-domain-fitness-fill text-domain-fitness-text`,
  },
  finances: {
    chip: `${PILL_BASE} border-l-domain-finances-accent bg-domain-finances-fill text-domain-finances-text`,
    block: `${PILL_BASE} border border-border border-l-domain-finances-accent bg-domain-finances-fill text-domain-finances-text`,
  },
  school: {
    chip: `${PILL_BASE} border-l-domain-school-accent bg-domain-school-fill text-domain-school-text`,
    block: `${PILL_BASE} border border-border border-l-domain-school-accent bg-domain-school-fill text-domain-school-text`,
  },
};

const FALLBACK: DomainColorClasses = {
  chip: `${PILL_BASE} border-l-domain-other-accent bg-domain-other-fill text-domain-other-text`,
  block: `${PILL_BASE} border border-border border-l-domain-other-accent bg-domain-other-fill text-domain-other-text`,
};

export const COMPLETED_ENTRY_CLASSES = "opacity-45 line-through";

export function getDomainClasses(domainName: string): DomainColorClasses {
  return DOMAIN_COLORS[domainName.toLowerCase()] ?? FALLBACK;
}

export function getDomainClassesById(
  domainId: number | null | undefined,
  domains: { id: number; name: string }[],
): DomainColorClasses {
  if (domainId == null) return FALLBACK;
  const domain = domains.find((d) => d.id === domainId);
  return domain ? getDomainClasses(domain.name) : FALLBACK;
}

const DOT_BY_KEY: Record<string, string> = {
  career: "bg-domain-career-accent",
  fitness: "bg-domain-fitness-accent",
  finances: "bg-domain-finances-accent",
  school: "bg-domain-school-accent",
};

export function domainDotClass(domainName: string): string {
  return DOT_BY_KEY[domainName.toLowerCase()] ?? "bg-domain-other-accent";
}

export function domainDotClassById(
  domainId: number | null | undefined,
  domains: { id: number; name: string }[],
): string {
  if (domainId == null) return "bg-domain-other-accent";
  const domain = domains.find((d) => d.id === domainId);
  return domain ? domainDotClass(domain.name) : "bg-domain-other-accent";
}