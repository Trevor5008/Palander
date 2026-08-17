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
  domain_id: number;
  user_id: number;
  objective_id: number | null;
};

export type EventCreate = Omit<EventRead, "id">;

export type EventUpdate = Partial<Omit<EventCreate, "user_id">>;

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

export type TaskCreate = Omit<TaskRead, "id">;

export type TaskUpdate = Partial<Omit<TaskCreate, "user_id">>;
