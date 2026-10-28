import type { Domain } from "../constants/domains";
import type {
  DomainRead,
  EventCreate,
  EventRead,
  EventUpdate,
  TaskCreate,
  TaskOverduePolicy,
  TaskRead,
  TaskUpdate,
} from "../types/api";
import { formatDateForInput, formatTimeForInput, parseDateInput } from "./date";
import {
  buildRrule,
  defaultTimezone,
  parseFreqFromRrule,
  parseIntervalFromRrule,
  parseUntilDateFromRrule,
  parseWeekdaysFromRrule,
  type RecurrenceFreq,
  type WeekdayCode,
} from "./recurrence";

export type EventFormState = {
  title: string;
  domain: Domain;
  objectiveIds: number[];
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
  isRecurring: boolean;
  recurrenceFreq: RecurrenceFreq;
  recurrenceInterval: number;
  recurrenceWeekdays: WeekdayCode[];
  recurrenceUntil: string;
  timezone: string;
};

export type TaskFormState = {
  title: string;
  domain: Domain;
  plannedDate: string;
  dueDate: string;
  dueTime: string;
  objectiveIds: number[];
  linkedEventId: string;
  isRecurring: boolean;
  recurrenceFreq: RecurrenceFreq;
  recurrenceInterval: number;
  recurrenceWeekdays: WeekdayCode[];
  recurrenceUntil: string;
  timezone: string;
  estimatedDurationMinutes: string;
  overduePolicy: TaskOverduePolicy;
};

function combineDateAndTime(date: string, time: string): string {
  return `${date}T${time}:00`;
}

export function eventFormToCreate(form: EventFormState, domainId: number): EventCreate {
  const { start_at, end_at } = form.allDay
    ? {
        start_at: combineDateAndTime(form.startDate, "00:00"),
        end_at: combineDateAndTime(form.endDate, "23:59"),
      }
    : {
        start_at: combineDateAndTime(form.startDate, form.startTime),
        end_at: combineDateAndTime(form.endDate, form.endTime),
      };

  if (form.isRecurring) {
    const recurrence_until = `${form.recurrenceUntil}T23:59:00`;
    return {
      title: form.title.trim(),
      start_at,
      end_at,
      is_recurring: true,
      rrule: buildRrule(
        form.recurrenceFreq,
        form.recurrenceInterval,
        form.recurrenceUntil,
        form.recurrenceWeekdays,
      ),
      timezone: form.timezone,
      recurrence_until,
      domain_id: domainId,
      objective_ids: form.objectiveIds,
    };
  }

  return {
    title: form.title.trim(),
    start_at,
    end_at,
    is_recurring: false,
    rrule: null,
    timezone: null,
    recurrence_until: null,
    domain_id: domainId,
    objective_ids: form.objectiveIds,
  };
}

export function eventFormToUpdate(form: EventFormState, domainId: number): EventUpdate {
  return eventFormToCreate(form, domainId);
}

export function taskFormToCreate(form: TaskFormState, domainId: number): TaskCreate {
  const duration =
    form.estimatedDurationMinutes.trim() === ""
      ? null
      : Number(form.estimatedDurationMinutes);
  const dueDatePart = form.isRecurring ? form.plannedDate : form.dueDate;
  const base: TaskCreate = {
    name: form.title.trim(),
    planned_for: form.plannedDate,
    due_at: combineDateAndTime(dueDatePart, form.dueTime),
    status: "active",
    is_recurring: form.isRecurring,
    rrule: null,
    timezone: null,
    recurrence_until: null,
    estimated_duration_minutes: duration,
    overdue_policy: form.overduePolicy,
    domain_id: domainId,
    event_id: form.linkedEventId ? Number(form.linkedEventId) : null,
    objective_ids: form.objectiveIds,
  };
  if (form.isRecurring) {
    base.rrule = buildRrule(
      form.recurrenceFreq,
      form.recurrenceInterval,
      form.recurrenceUntil,
      form.recurrenceWeekdays,
    );
    base.timezone = form.timezone;
    base.recurrence_until = `${form.recurrenceUntil}T23:59:00`;
  }
  return base;
}

export function taskFormToUpdate(form: TaskFormState, domainId: number): TaskUpdate {
  return taskFormToCreate(form, domainId);
}

export function isAllDayEvent(event: EventRead): boolean {
  const start = new Date(event.start_at);
  const end = new Date(event.end_at);
  return (
    start.getHours() === 0 &&
    start.getMinutes() === 0 &&
    end.getHours() === 23 &&
    end.getMinutes() >= 59
  );
}

export function partitionEvents(events: EventRead[]): {
  allDay: EventRead[];
  timed: EventRead[];
} {
  const allDay: EventRead[] = [];
  const timed: EventRead[] = [];
  for (const event of events) {
    if (isAllDayEvent(event)) {
      allDay.push(event);
    } else {
      timed.push(event);
    }
  }
  return { allDay, timed };
}

export function eventReadToForm(event: EventRead, domains: DomainRead[]): EventFormState {
  const start = new Date(event.start_at);
  const end = new Date(event.end_at);
  const allDay = isAllDayEvent(event);

  const domainName =
    domains.find((d) => d.id === event.domain_id)?.name ?? "career";

  return {
    title: event.title,
    domain: domainName as Domain,
    objectiveIds: event.objective_ids ?? [],
    startDate: formatDateForInput(start),
    endDate: formatDateForInput(end),
    startTime: formatTimeForInput(start),
    endTime: formatTimeForInput(end),
    allDay,
    isRecurring: event.is_recurring,
    recurrenceFreq: parseFreqFromRrule(event.rrule),
    recurrenceInterval: parseIntervalFromRrule(event.rrule),
    recurrenceWeekdays: parseWeekdaysFromRrule(event.rrule),
    recurrenceUntil: event.recurrence_until
      ? formatDateForInput(new Date(event.recurrence_until))
      : parseUntilDateFromRrule(event.rrule, formatDateForInput(start)),
    timezone: event.timezone ?? defaultTimezone(),
  };
}

export function validateEventFormRange(form: EventFormState): string | null {
  const { start_at, end_at } = eventFormToCreate(form, 0);
  if (new Date(end_at).getTime() < new Date(start_at).getTime()) {
    return "End must be on or after start";
  }
  return null;
}

export function taskReadToForm(task: TaskRead, domains: DomainRead[]): TaskFormState {
  const due = new Date(task.due_at);
  const domainName =
    domains.find((d) => d.id === task.domain_id)?.name ?? "career";

  return {
    title: task.name,
    domain: domainName as Domain,
    plannedDate: task.planned_for,
    dueDate: formatDateForInput(due),
    dueTime: formatTimeForInput(due),
    objectiveIds: task.objective_ids ?? [],
    linkedEventId: task.event_id ? String(task.event_id) : "",
    isRecurring: task.is_recurring,
    recurrenceFreq: parseFreqFromRrule(task.rrule),
    recurrenceInterval: parseIntervalFromRrule(task.rrule),
    recurrenceWeekdays: parseWeekdaysFromRrule(task.rrule),
    recurrenceUntil: task.recurrence_until
      ? formatDateForInput(new Date(task.recurrence_until))
      : task.planned_for,
    timezone: task.timezone ?? defaultTimezone(),
    estimatedDurationMinutes:
      task.estimated_duration_minutes != null ? String(task.estimated_duration_minutes) : "",
    overduePolicy: task.overdue_policy ?? "keep_overdue",
  };
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function endOfDay(date: Date): Date {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
}

export function toApiDateTime(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}

export function isSameApiDay(iso: string, day: Date): boolean {
  const value = new Date(iso);
  return (
    value.getFullYear() === day.getFullYear() &&
    value.getMonth() === day.getMonth() &&
    value.getDate() === day.getDate()
  );
}

export function isSamePlannedDay(plannedFor: string, day: Date): boolean {
  const parts = plannedFor.split("-").map(Number);
  if (parts.length !== 3) return false;
  return (
    parts[0] === day.getFullYear() &&
    parts[1] === day.getMonth() + 1 &&
    parts[2] === day.getDate()
  );
}

export function dayFromCellKey(key: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
  return parseDateInput(key);
}
