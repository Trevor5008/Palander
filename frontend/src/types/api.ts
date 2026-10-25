export type DomainRead = {
  id: number;
  name: string;
  user_id: number;
};

export type EventRead = {
  id: number;
  title: string;
  start_at: string;
  end_at: string;
  is_recurring: boolean;
  rrule: string | null;
  timezone: string | null;
  recurrence_until: string | null;
  domain_id: number;
  user_id: number;
  objective_id: number | null;
  series_id: number | null;
};

export type EventCreate = Omit<EventRead, "id" | "user_id" | "series_id">;

export type EventUpdate = Partial<EventCreate>;

export type TaskRead = {
  id: number;
  name: string;
  due_date: string;
  is_recurring: boolean;
  rrule: string | null;
  user_id: number;
  domain_id: number | null;
  event_id: number | null;
  objective_id: number | null;
};

export type TaskCreate = Omit<TaskRead, "id" | "user_id">;

export type TaskUpdate = Partial<TaskCreate>;

export type TokenResponse = {
  access_token: string;
  token_type: string;
};

export type UserRead = {
  id: number;
  username: string;
  email: string;
};

export type ImportCandidateRead = {
  client_key: string;
  title: string;
  start_at: string;
  end_at: string;
  weekdays: string[];
  recurrence_until: string;
  timezone: string;
  rrule: string;
  rrule_human: string;
  domain_id: number | null;
  source_snippet: string;
  source_page?: number | null;
  source_filename?: string | null;
  confidence: number;
  warnings: string[];
  duplicate_of_event_id: number | null;
  included: boolean;
  unresolved: boolean;
};

export type ScheduleFormatHint = "auto" | "plain" | "csv";

export type ScheduleParseRequest = {
  text: string;
  default_year: number;
  timezone: string;
  term_start?: string | null;
  term_end?: string | null;
  format_hint?: ScheduleFormatHint;
};

export type FormatIssueRead = {
  line_number: number;
  snippet: string;
  code: string;
  message: string;
  help_section: string;
};

export type ScheduleParseResponse = {
  candidates: ImportCandidateRead[];
  format_issues: FormatIssueRead[];
};

export type ScheduleImportRequest = {
  candidates: Array<{
    client_key: string;
    title: string;
    start_at: string;
    end_at: string;
    weekdays: string[];
    recurrence_until: string;
    timezone: string;
    domain_id: number;
    included: boolean;
  }>;
};

export type ScheduleImportResult = {
  imported: number;
  skipped: number;
  duplicate: number;
  unresolved: number;
};

export type DailyNoteRead = {
  note_date: string;
  content: string;
  created_at: string | null;
  updated_at: string | null;
};

export type DailyNoteUpsert = {
  content: string;
  if_updated_at?: string | null;
};

export type EventNoteRead = {
  id: number | null;
  event_id: number;
  occurrence_start_at: string;
  content: string;
  created_at: string | null;
  updated_at: string | null;
};

export type EventNoteUpsert = {
  content: string;
  occurrence_start_at: string;
  if_updated_at?: string | null;
};

export type SeriesNoteStackItem = {
  occurrence_start_at: string;
  content: string;
  updated_at: string | null;
};

export type SeriesNoteStackRead = {
  items: SeriesNoteStackItem[];
};
