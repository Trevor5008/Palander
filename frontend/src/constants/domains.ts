export const DOMAINS = ["career", "fitness", "finances", "school"] as const;

export type Domain = (typeof DOMAINS)[number];
