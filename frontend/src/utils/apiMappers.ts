import type { Domain } from "../constants/domains";
import type { DomainRead, EventCreate, EventRead, EventUpdate, TaskCreate, TaskRead, TaskUpdate } from "../types/api";
import { formatDateForInput, formatTimeForInput, parseDateInput } from "./date";

export type EventFormState = {
  title: string;
  domain: Domain;
  date: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
  isRecurring: boolean;
};

export type TaskFormState = {
  title: string;
  domain: Domain;
  date: string;
  startTime: string;
  linkedEventId: string;
};

function combineDateAndTime(date: string, time: string): string {
  return `${date}T${time}:00`;
}

export function eventFormToCreate(form: EventFormState, domainId: number): EventCreate {
  const { start_at, end_at } = form.allDay
    ? {
        start_at: combineDateAndTime(form.date, "00:00"),
        end_at: combineDateAndTime(form.date, "23:59"),
      }
    : {
        start_at: combineDateAndTime(form.date, form.startTime),
        end_at: combineDateAndTime(form.date, form.endTime),
      };

  return {
    title: form.title.trim(),
    start_at,
    end_at,
    is_recurring: form.isRecurring,
    rrule: null,
    domain_id: domainId,
    objective_id: null,
  };
}

export function eventFormToUpdate(form: EventFormState, domainId: number): EventUpdate {
  return eventFormToCreate(form, domainId);
}

export function taskFormToCreate(form: TaskFormState, domainId: number): TaskCreate {
  return {
    name: form.title.trim(),
    due_date: combineDateAndTime(form.date, form.startTime),
    is_recurring: false,
    rrule: null,
    domain_id: domainId,
    event_id: form.linkedEventId ? Number(form.linkedEventId) : null,
    objective_id: null,
  };
}

export function taskFormToUpdate(form: TaskFormState, domainId: number): TaskUpdate {
  return taskFormToCreate(form, domainId);
}

export function eventReadToForm(event: EventRead, domains: DomainRead[]): EventFormState {
  const start = new Date(event.start_at);
  const end = new Date(event.end_at);
  const allDay =
    start.getHours() === 0 &&
    start.getMinutes() === 0 &&
    end.getHours() === 23 &&
    end.getMinutes() >= 59;

  const domainName =
    domains.find((d) => d.id === event.domain_id)?.name ?? "career";

  return {
    title: event.title,
    domain: domainName as Domain,
    date: formatDateForInput(start),
    startTime: formatTimeForInput(start),
    endTime: formatTimeForInput(end),
    allDay,
    isRecurring: event.is_recurring,
  };
}

export function taskReadToForm(task: TaskRead, domains: DomainRead[]): TaskFormState {
  const due = new Date(task.due_date);
  const domainName =
    domains.find((d) => d.id === task.domain_id)?.name ?? "career";

  return {
    title: task.name,
    domain: domainName as Domain,
    date: formatDateForInput(due),
    startTime: formatTimeForInput(due),
    linkedEventId: task.event_id ? String(task.event_id) : "",
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

export function dayFromCellKey(key: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
  return parseDateInput(key);
}
