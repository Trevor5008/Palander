import { clearToken, getToken } from "./auth/token";
import type {
  DomainRead,
  EventCreate,
  EventRead,
  EventUpdate,
  RecurrenceEditScope,
  DailyWorkspaceRead,
  PlanningProgressRead,
  WeeklyReviewRead,
  ObjectiveCreate,
  ObjectiveRead,
  ObjectiveUpdate,
  TaskCreate,
  TaskRead,
  TaskUpdate,
  TokenResponse,
  UserRead,
  ScheduleImportRequest,
  ScheduleImportResult,
  ScheduleParseRequest,
  ScheduleParseResponse,
} from "./types/api";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

function scheduleEndpointErrorMessage(status: number, message: string): string {
  if (status === 404) {
    return `${message} — PDF import requires API 0.8.0+. Rebuild/restart the backend (e.g. docker compose up -d --build api).`;
  }
  return message;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
  });

  if (response.status === 401 && token) {
    clearToken();
  }

  if (!response.ok) {
    const detail = await response.text();
    let message = detail || `Request failed: ${response.status}`;
    try {
      const parsed = JSON.parse(detail) as { detail?: string };
      if (parsed.detail) message = parsed.detail;
    } catch {
      // keep raw body
    }
    if (response.status === 404 && path.startsWith("/schedule")) {
      message = scheduleEndpointErrorMessage(response.status, message);
    }
    throw new ApiError(message, response.status);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

export async function fetchHealth(): Promise<{ status: string; version?: string }> {
  return request("/health");
}

export async function login(username: string, password: string): Promise<TokenResponse> {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export async function fetchCurrentUser(): Promise<UserRead> {
  return request("/auth/me");
}

export async function fetchDomains(): Promise<DomainRead[]> {
  return request("/domains");
}

export async function fetchEvents(start: string, end: string): Promise<EventRead[]> {
  const params = new URLSearchParams({ start, end });
  return request(`/events?${params}`);
}

export async function fetchEvent(id: number): Promise<EventRead> {
  return request(`/events/${id}`);
}

export async function createEvent(body: EventCreate): Promise<EventRead> {
  return request("/events", { method: "POST", body: JSON.stringify(body) });
}

export type EventMutationOptions = {
  scope?: RecurrenceEditScope;
  occurrence_start_at?: string;
};

export async function updateEvent(
  id: number,
  body: EventUpdate,
  options?: EventMutationOptions,
): Promise<EventRead> {
  const params = new URLSearchParams();
  if (options?.scope) params.set("scope", options.scope);
  if (options?.occurrence_start_at) params.set("occurrence_start_at", options.occurrence_start_at);
  const qs = params.toString();
  return request(`/events/${id}${qs ? `?${qs}` : ""}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteEvent(id: number, options?: EventMutationOptions): Promise<void> {
  const params = new URLSearchParams();
  if (options?.scope) params.set("scope", options.scope);
  if (options?.occurrence_start_at) params.set("occurrence_start_at", options.occurrence_start_at);
  const qs = params.toString();
  return request(`/events/${id}${qs ? `?${qs}` : ""}`, { method: "DELETE" });
}

export async function fetchTasks(start: string, end: string): Promise<TaskRead[]> {
  const params = new URLSearchParams({ start, end });
  return request(`/tasks?${params}`);
}

export async function fetchTask(id: number): Promise<TaskRead> {
  return request(`/tasks/${id}`);
}

export async function createTask(body: TaskCreate): Promise<TaskRead> {
  return request("/tasks", { method: "POST", body: JSON.stringify(body) });
}

export type TaskMutationOptions = {
  scope?: RecurrenceEditScope;
  occurrence_date?: string;
};

export async function updateTask(
  id: number,
  body: TaskUpdate,
  options?: TaskMutationOptions,
): Promise<TaskRead> {
  const params = new URLSearchParams();
  if (options?.scope) params.set("scope", options.scope);
  if (options?.occurrence_date) params.set("occurrence_date", options.occurrence_date);
  const qs = params.toString();
  return request(`/tasks/${id}${qs ? `?${qs}` : ""}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteTask(id: number, options?: TaskMutationOptions): Promise<void> {
  const params = new URLSearchParams();
  if (options?.scope) params.set("scope", options.scope);
  if (options?.occurrence_date) params.set("occurrence_date", options.occurrence_date);
  const qs = params.toString();
  return request(`/tasks/${id}${qs ? `?${qs}` : ""}`, { method: "DELETE" });
}

export async function fetchObjectives(params?: {
  domain_id?: number;
  status?: string;
}): Promise<ObjectiveRead[]> {
  const search = new URLSearchParams();
  if (params?.domain_id != null) {
    search.set("domain_id", String(params.domain_id));
  }
  if (params?.status) {
    search.set("status", params.status);
  }
  const qs = search.toString();
  return request(`/objectives${qs ? `?${qs}` : ""}`);
}

export async function createObjective(body: ObjectiveCreate): Promise<ObjectiveRead> {
  return request("/objectives", { method: "POST", body: JSON.stringify(body) });
}

export async function updateObjective(
  id: number,
  body: ObjectiveUpdate,
): Promise<ObjectiveRead> {
  return request(`/objectives/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteObjective(id: number): Promise<void> {
  return request(`/objectives/${id}`, { method: "DELETE" });
}

export async function fetchDailyWorkspace(date: string): Promise<DailyWorkspaceRead> {
  const params = new URLSearchParams({ date });
  return request(`/daily-workspace?${params}`);
}

export async function fetchWeeklyReview(weekStart: string): Promise<WeeklyReviewRead> {
  const params = new URLSearchParams({ week_start: weekStart });
  return request(`/planning/weekly-review?${params}`);
}

export async function fetchPlanningProgress(weeks = 8): Promise<PlanningProgressRead> {
  const params = new URLSearchParams({ weeks: String(weeks) });
  return request(`/planning/progress?${params}`);
}

export async function carryForwardTasks(
  items: Array<{ task_id: number; planned_for: string }>,
): Promise<{ updated: number }> {
  return request("/planning/carry-forward", {
    method: "POST",
    body: JSON.stringify({ items }),
  });
}

export async function parseSchedule(body: ScheduleParseRequest): Promise<ScheduleParseResponse> {
  return request("/schedule/parse", { method: "POST", body: JSON.stringify(body) });
}

export async function importSchedule(body: ScheduleImportRequest): Promise<ScheduleImportResult> {
  return request("/schedule/import", { method: "POST", body: JSON.stringify(body) });
}

export async function parseSchedulePdf(
  file: File,
  fields: {
    default_year: number;
    timezone: string;
    term_start?: string;
    term_end?: string;
  },
): Promise<ScheduleParseResponse> {
  const form = new FormData();
  form.append("file", file);
  form.append("default_year", String(fields.default_year));
  form.append("timezone", fields.timezone);
  if (fields.term_start) {
    form.append("term_start", fields.term_start);
  }
  if (fields.term_end) {
    form.append("term_end", fields.term_end);
  }

  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/schedule/parse-pdf`, {
    method: "POST",
    headers,
    body: form,
  });

  if (response.status === 401 && token) {
    clearToken();
  }

  if (!response.ok) {
    const detail = await response.text();
    let message = detail || `Request failed: ${response.status}`;
    try {
      const parsed = JSON.parse(detail) as { detail?: string | { code?: string; message?: string } };
      if (typeof parsed.detail === "string") {
        message = parsed.detail;
      } else if (parsed.detail?.message) {
        message = parsed.detail.message;
      }
    } catch {
      // keep raw body
    }
    throw new Error(scheduleEndpointErrorMessage(response.status, message));
  }

  return response.json() as Promise<ScheduleParseResponse>;
}
