import { clearToken, getToken } from "./auth/token";
import type {
  DomainRead,
  EventCreate,
  EventRead,
  EventUpdate,
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
    throw new Error(message);
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

export async function updateEvent(id: number, body: EventUpdate): Promise<EventRead> {
  return request(`/events/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteEvent(id: number): Promise<void> {
  return request(`/events/${id}`, { method: "DELETE" });
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

export async function updateTask(id: number, body: TaskUpdate): Promise<TaskRead> {
  return request(`/tasks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteTask(id: number): Promise<void> {
  return request(`/tasks/${id}`, { method: "DELETE" });
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
