export type DomainColorClasses = {
  chip: string;
  block: string;
};

const DOMAIN_COLORS: Record<string, DomainColorClasses> = {
  career: {
    chip: "bg-blue-100 text-blue-900 hover:bg-blue-200",
    block: "border-blue-300 bg-blue-100 text-blue-900 hover:bg-blue-200",
  },
  fitness: {
    chip: "bg-green-100 text-green-900 hover:bg-green-200",
    block: "border-green-300 bg-green-100 text-green-900 hover:bg-green-200",
  },
  finances: {
    chip: "bg-purple-100 text-purple-900 hover:bg-purple-200",
    block: "border-purple-300 bg-purple-100 text-purple-900 hover:bg-purple-200",
  },
  school: {
    chip: "bg-amber-100 text-amber-900 hover:bg-amber-200",
    block: "border-amber-300 bg-amber-100 text-amber-900 hover:bg-amber-200",
  },
};

const FALLBACK: DomainColorClasses = {
  chip: "bg-gray-100 text-gray-900 hover:bg-gray-200",
  block: "border-gray-300 bg-gray-100 text-gray-900 hover:bg-gray-200",
};

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
