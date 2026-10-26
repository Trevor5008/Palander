export const WEEKDAY_CODES = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"] as const;
export type WeekdayCode = (typeof WEEKDAY_CODES)[number];

export type RecurrenceFreq = "DAILY" | "WEEKLY" | "MONTHLY";

export const WEEKDAY_LABELS: Record<WeekdayCode, string> = {
  MO: "Mon",
  TU: "Tue",
  WE: "Wed",
  TH: "Thu",
  FR: "Fri",
  SA: "Sat",
  SU: "Sun",
};

export function defaultTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

export function defaultTermStart(year: number): string {
  return `${year}-08-18`;
}

export function defaultTermEnd(year: number): string {
  return `${year}-12-15`;
}

function formatUntilUtc(recurrenceUntilDate: string): string {
  const [year, month, day] = recurrenceUntilDate.split("-").map(Number);
  const untilUtc = new Date(Date.UTC(year, month - 1, day, 23, 59, 59));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${untilUtc.getUTCFullYear()}${pad(untilUtc.getUTCMonth() + 1)}${pad(untilUtc.getUTCDate())}T${pad(untilUtc.getUTCHours())}${pad(untilUtc.getUTCMinutes())}${pad(untilUtc.getUTCSeconds())}Z`;
}

export function buildRrule(
  freq: RecurrenceFreq,
  interval: number,
  recurrenceUntilDate: string,
  weekdays: WeekdayCode[],
): string {
  const parts = [`FREQ=${freq}`];
  if (interval > 1) {
    parts.push(`INTERVAL=${interval}`);
  }
  if (freq === "WEEKLY") {
    parts.push(`BYDAY=${weekdays.join(",")}`);
  }
  parts.push(`UNTIL=${formatUntilUtc(recurrenceUntilDate)}`);
  return parts.join(";");
}

export function buildWeeklyRrule(
  weekdays: WeekdayCode[],
  recurrenceUntilDate: string,
  _timezone: string,
): string {
  return buildRrule("WEEKLY", 1, recurrenceUntilDate, weekdays);
}

export function parseFreqFromRrule(rrule: string | null): RecurrenceFreq {
  if (!rrule) return "WEEKLY";
  const match = rrule.toUpperCase().match(/FREQ=([A-Z]+)/);
  const freq = match?.[1];
  if (freq === "DAILY" || freq === "MONTHLY" || freq === "WEEKLY") return freq;
  return "WEEKLY";
}

export function parseIntervalFromRrule(rrule: string | null): number {
  if (!rrule) return 1;
  const match = rrule.toUpperCase().match(/INTERVAL=(\d+)/);
  return match ? Number(match[1]) : 1;
}

export function parseWeekdaysFromRrule(rrule: string | null): WeekdayCode[] {
  if (!rrule) return ["MO"];
  const match = rrule.toUpperCase().match(/BYDAY=([A-Z,]+)/);
  if (!match) return ["MO"];
  return match[1]
    .split(",")
    .map((d) => d.trim())
    .filter((d): d is WeekdayCode => WEEKDAY_CODES.includes(d as WeekdayCode));
}

export function parseUntilDateFromRrule(rrule: string | null, fallback: string): string {
  if (!rrule) return fallback;
  const match = rrule.toUpperCase().match(/UNTIL=(\d{8})/);
  if (!match) return fallback;
  const raw = match[1];
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
}

export function eventOccurrenceKey(event: { id: number; start_at: string }): string {
  return `${event.id}-${event.start_at}`;
}
