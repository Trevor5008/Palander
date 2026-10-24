export type ScheduleHelpSection = "plain" | "csv" | "weekdays" | "term" | "pdf";

export const WEEKDAY_LETTER_HELP: { letter: string; day: string }[] = [
  { letter: "M", day: "Monday" },
  { letter: "T", day: "Tuesday" },
  { letter: "W", day: "Wednesday" },
  { letter: "R", day: "Thursday" },
  { letter: "F", day: "Friday" },
  { letter: "S", day: "Saturday" },
  { letter: "U", day: "Sunday" },
];

export const SCHEDULE_HELP_SECTIONS: Record<
  ScheduleHelpSection,
  { title: string; body: string[]; examples?: { good: string[]; bad?: string[] } }
> = {
  plain: {
    title: "Plain lines",
    body: [
      "One event per line. Punctuation is optional — spaces work between title, days, and times.",
      "Times: 09:00 or 0900. Use two times for start and end (space or dash).",
    ],
    examples: {
      good: [
        "Chemistry Lab M W 0900 1145",
        "Team Sync Mon Wed 09:00 10:30",
        "Office Hours Tue 13:00-14:00",
      ],
      bad: ["Chemistry Lab M,W 09:00-10:30 (use M W with spaces, or Mon Wed)"],
    },
  },
  weekdays: {
    title: "Weekday letters",
    body: [
      "Single letters match common academic schedules (T = Tuesday, R = Thursday).",
      "You can also use Mon, Wed, Monday, Wednesday, etc.",
    ],
  },
  csv: {
    title: "CSV / TSV",
    body: ["Four columns: Title, weekdays, start time, end time."],
    examples: {
      good: ["Chemistry Lab,Mon;Wed,09:00,10:30", "Team Sync,T R,1300,1400"],
    },
  },
  term: {
    title: "Term dates",
    body: [
      "Term starts sets the first occurrence date for each series.",
      "Repeat until applies to every imported series (same end date for all rows).",
    ],
  },
  pdf: {
    title: "FIU Schedule of Classes PDF",
    body: [
      "Upload a text-based Schedule of Classes export (PantherSoft / Oracle Analytics Publisher).",
      "Each course meeting becomes a weekly recurring event using Days, times, and From/To dates from the PDF.",
      "Scanned or image-only PDFs are not supported (OCR required). TBA and asynchronous sections are flagged, not auto-imported.",
    ],
  },
};
