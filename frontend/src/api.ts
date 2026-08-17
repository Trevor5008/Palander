import { DEV_USER_ID } from "./constants/user";
import type {
  DomainRead,
  EventCreate,
  EventRead,
  EventUpdate,
  TaskCreate,
  TaskRead,
  TaskUpdate,
} from "./types/api";

export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Request failed: ${response.status}`);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

function userQuery(userId: number) {
  return `user_id=${userId}`;
}

export async function fetchHealth(): Promise<{ status: string; version?: string }> {
  return request("/health");
}

export async function fetchDomains(userId = DEV_USER_ID): Promise<DomainRead[]> {
  return request(`/domains?${userQuery(userId)}`);
}

export async function fetchEvents(
  start: string,
  end: string,
  userId = DEV_USER_ID,
): Promise<EventRead[]> {
  const params = new URLSearchParams({
    user_id: String(userId),
    start,
    end,
  });
  return request(`/events?${params}`);
}

export async function fetchEvent(id: number, userId = DEV_USER_ID): Promise<EventRead> {
  return request(`/events/${id}?${userQuery(userId)}`);
}

export async function createEvent(body: EventCreate): Promise<EventRead> {
  return request("/events", { method: "POST", body: JSON.stringify(body) });
}

export async function updateEvent(
  id: number,
  body: EventUpdate,
  userId = DEV_USER_ID,
): Promise<EventRead> {
  return request(`/events/${id}?${userQuery(userId)}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteEvent(id: number, userId = DEV_USER_ID): Promise<void> {
  return request(`/events/${id}?${userQuery(userId)}`, { method: "DELETE" });
}

export async function fetchTasks(
  start: string,
  end: string,
  userId = DEV_USER_ID,
): Promise<TaskRead[]> {
  const params = new URLSearchParams({
    user_id: String(userId),
    start,
    end,
  });
  return request(`/tasks?${params}`);
}

export async function fetchTask(id: number, userId = DEV_USER_ID): Promise<TaskRead> {
  return request(`/tasks/${id}?${userQuery(userId)}`);
}

export async function createTask(body: TaskCreate): Promise<TaskRead> {
  return request("/tasks", { method: "POST", body: JSON.stringify(body) });
}

export async function updateTask(
  id: number,
  body: TaskUpdate,
  userId = DEV_USER_ID,
): Promise<TaskRead> {
  return request(`/tasks/${id}?${userQuery(userId)}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteTask(id: number, userId = DEV_USER_ID): Promise<void> {
  return request(`/tasks/${id}?${userQuery(userId)}`, { method: "DELETE" });
}
