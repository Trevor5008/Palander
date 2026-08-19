import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import {
  createEvent,
  createTask,
  deleteEvent,
  deleteTask,
  fetchDomains,
  fetchEvents,
  updateEvent,
  updateTask,
} from "../api";
import { DOMAINS, type Domain } from "../constants/domains";
import type { DomainRead, EventRead, TaskRead } from "../types/api";
import {
  endOfMonth,
  eventFormToCreate,
  eventFormToUpdate,
  eventReadToForm,
  startOfMonth,
  taskFormToCreate,
  taskFormToUpdate,
  taskReadToForm,
  toApiDateTime,
} from "../utils/apiMappers";
import {
  addHours,
  formatDateForInput,
  formatTimeForInput,
  isSameDay,
  parseDateInput,
} from "../utils/date";

type EntryType = "event" | "task";

type EventModalProps = {
  showAddEventModal: boolean;
  onClose: () => void;
  defaultDate?: Date;
  editEvent?: EventRead | null;
  editTask?: TaskRead | null;
  onSaved?: () => void;
  onDeleted?: () => void;
};

function getDefaultTimes(defaultDate: Date, now: Date) {
  const base = isSameDay(defaultDate, now) ? now : parseDateInput(formatDateForInput(defaultDate));
  if (!isSameDay(defaultDate, now)) {
    base.setHours(9, 0, 0, 0);
  }
  return {
    startTime: formatTimeForInput(base),
    endTime: formatTimeForInput(addHours(base, 1)),
  };
}

export function EventModal({
  showAddEventModal,
  onClose,
  defaultDate = new Date(),
  editEvent = null,
  editTask = null,
  onSaved,
  onDeleted,
}: EventModalProps) {
  const isEditMode = Boolean(editEvent || editTask);
  const [entryType, setEntryType] = useState<EntryType>("event");
  const [title, setTitle] = useState("");
  const [domain, setDomain] = useState<Domain>("career");
  const [date, setDate] = useState(() => formatDateForInput(defaultDate));
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [allDay, setAllDay] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [linkedEventId, setLinkedEventId] = useState("");
  const [domains, setDomains] = useState<DomainRead[]>([]);
  const [linkedEvents, setLinkedEvents] = useState<EventRead[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!showAddEventModal) return;

    setError(null);
    fetchDomains()
      .then(setDomains)
      .catch(() => setError("Failed to load domains"));

    const rangeStart = toApiDateTime(startOfMonth(defaultDate));
    const rangeEnd = toApiDateTime(endOfMonth(defaultDate));
    // Fetch linked events
    fetchEvents(rangeStart, rangeEnd)
      .then(setLinkedEvents)
      .catch(() => setLinkedEvents([]));
  }, [showAddEventModal, defaultDate]);

  useEffect(() => {
    if (!showAddEventModal) return;

    if (editEvent && domains.length > 0) {
      const form = eventReadToForm(editEvent, domains);
      setEntryType("event");
      setTitle(form.title);
      setDomain(form.domain);
      setDate(form.date);
      setStartTime(form.startTime);
      setEndTime(form.endTime);
      setAllDay(form.allDay);
      setIsRecurring(form.isRecurring);
      setLinkedEventId("");
      return;
    }

    if (editTask && domains.length > 0) {
      const form = taskReadToForm(editTask, domains);
      setEntryType("task");
      setTitle(form.title);
      setDomain(form.domain);
      setDate(form.date);
      setStartTime(form.startTime);
      setEndTime("10:00");
      setAllDay(false);
      setIsRecurring(false);
      setLinkedEventId(form.linkedEventId);
      return;
    }

    if (!editEvent && !editTask) {
      const times = getDefaultTimes(defaultDate, new Date());
      setEntryType("event");
      setTitle("");
      setDomain("career");
      setDate(formatDateForInput(defaultDate));
      setStartTime(times.startTime);
      setEndTime(times.endTime);
      setAllDay(false);
      setIsRecurring(false);
      setLinkedEventId("");
    }
  }, [showAddEventModal, defaultDate, editEvent, editTask, domains]);

  const resolveDomainId = (): number | null => {
    const match = domains.find((d) => d.name === domain);
    return match?.id ?? null;
  };

  const handleSave = async (category: EntryType) => {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    const domainId = resolveDomainId();
    if (domainId === null) {
      setError("Unknown domain — run database migrations");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (category === "event") {
        const form = { title, domain, date, startTime, endTime, allDay, isRecurring };
        if (editEvent) {
          await updateEvent(editEvent.id, eventFormToUpdate(form, domainId));
        } else {
          await createEvent(eventFormToCreate(form, domainId));
        }
      } else {
        const form = { title, domain, date, startTime, linkedEventId };
        if (editTask) {
          await updateTask(editTask.id, taskFormToUpdate(form, domainId));
        } else {
          await createTask(taskFormToCreate(form, domainId));
        }
      }
      onSaved?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  // Delete entry
  const handleDelete = async () => {
    if (!window.confirm("Delete this entry?")) return;

    setSaving(true);
    setError(null);

    try {
      if (editEvent) {
        await deleteEvent(editEvent.id);
      } else if (editTask) {
        await deleteTask(editTask.id);
      }
      onDeleted?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={showAddEventModal} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-5 shadow-xl">
          <div className="mb-4 flex items-start justify-between gap-4">
            <DialogTitle className="sr-only">
              {isEditMode ? "Edit entry" : "Add entry"}
            </DialogTitle>
            <input
              type="text"
              placeholder="Add title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border-0 text-lg font-medium placeholder:text-gray-400 focus:outline-none focus:ring-0"
            />
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="shrink-0 rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            >
              <XMarkIcon className="size-5" />
            </button>
          </div>

          {!isEditMode && (
            <div className="mb-4 flex gap-4 text-sm">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="entryType"
                  checked={entryType === "event"}
                  onChange={() => setEntryType("event")}
                />
                Event
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="entryType"
                  checked={entryType === "task"}
                  onChange={() => setEntryType("task")}
                />
                Task
              </label>
            </div>
          )}

          <div className="space-y-3 text-sm">
            <div>
              <label htmlFor="domain" className="mb-1 block text-gray-500">
                Domain
              </label>
              <select
                id="domain"
                value={domain}
                onChange={(e) => setDomain(e.target.value as Domain)}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              >
                {DOMAINS.map((option) => (
                  <option key={option} value={option}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="date" className="mb-1 block text-gray-500">
                {entryType === "event" ? "Date" : "Due on"}
              </label>
              <input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>

            {entryType === "event" ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="startTime" className="mb-1 block text-gray-500">
                    Start time
                  </label>
                  <input
                    id="startTime"
                    type="time"
                    value={startTime}
                    disabled={allDay}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 disabled:bg-gray-50"
                  />
                </div>
                <div>
                  <label htmlFor="endTime" className="mb-1 block text-gray-500">
                    End time
                  </label>
                  <input
                    id="endTime"
                    type="time"
                    value={endTime}
                    disabled={allDay}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 disabled:bg-gray-50"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label htmlFor="taskTime" className="mb-1 block text-gray-500">
                  Time
                </label>
                <input
                  id="taskTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
            )}

            {entryType === "task" && (
              <div>
                <label htmlFor="linkedEvent" className="mb-1 block text-gray-500">
                  Linked event (optional)
                </label>
                <select
                  id="linkedEvent"
                  value={linkedEventId}
                  onChange={(e) => setLinkedEventId(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="">None</option>
                  {linkedEvents.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {entryType === "event" && (
              <div className="space-y-2 pt-1">
                <label className="flex cursor-pointer items-center justify-between">
                  <span>All day event</span>
                  <input
                    type="checkbox"
                    checked={allDay}
                    onChange={(e) => setAllDay(e.target.checked)}
                  />
                </label>
                <label className="flex cursor-pointer items-center justify-between">
                  <span>Recurring event</span>
                  <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                  />
                </label>
              </div>
            )}
          </div>

          {error && (
            <p className="mt-4 text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <div className="mt-6 flex items-center justify-between gap-3">
            {isEditMode ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
              >
                Delete
              </button>
            ) : (
              <span />
            )}
            <button
              type="button"
              onClick={() => handleSave(entryType)}
              disabled={saving}
              className="rounded-md bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
            >
              {saving ? "Saving…" : `Save ${entryType === "event" ? "Event" : "Task"}`}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
