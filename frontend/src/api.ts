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
} from "./types/api";

export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

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
    throw new Error(detail || `Request failed: ${response.status}`);
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
