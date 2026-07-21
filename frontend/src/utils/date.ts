export function formatDate(date: Date): string {
  return date.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}   