export const DOMAINS = ["career", "fitness", "finances", "school"] as const;

export type Domain = (typeof DOMAINS)[number];

/** API domain slugs are lowercase; show title case in the UI. */
export function formatDomainLabel(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return trimmed;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}
