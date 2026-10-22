import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useRef, useState } from "react";
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
  validateEventFormRange,
} from "../utils/apiMappers";
import {
  addHours,
  formatDateForInput,
  formatTimeForInput,
  isSameDay,
  parseDateInput,
} from "../utils/date";
import {
  defaultTimezone,
  WEEKDAY_CODES,
  WEEKDAY_LABELS,
  type WeekdayCode,
} from "../utils/recurrence";

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
  const [startDate, setStartDate] = useState(() => formatDateForInput(defaultDate));
  const [endDate, setEndDate] = useState(() => formatDateForInput(defaultDate));
  const [taskDate, setTaskDate] = useState(() => formatDateForInput(defaultDate));
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [allDay, setAllDay] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceWeekdays, setRecurrenceWeekdays] = useState<WeekdayCode[]>(["MO"]);
  const [recurrenceUntil, setRecurrenceUntil] = useState(() => formatDateForInput(defaultDate));
  const [timezone, setTimezone] = useState(() => defaultTimezone());
  const [linkedEventId, setLinkedEventId] = useState("");
  const [domains, setDomains] = useState<DomainRead[]>([]);
  const [linkedEvents, setLinkedEvents] = useState<EventRead[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const formSeedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!showAddEventModal) return;

    setError(null);
    fetchDomains()
      .then(setDomains)
      .catch(() => setError("Failed to load domains"));
  }, [showAddEventModal]);

  useEffect(() => {
    if (!showAddEventModal) return;

    const anchorStart = parseDateInput(startDate);
    const anchorEnd = parseDateInput(endDate);
    const rangeFrom =
      anchorStart.getTime() <= anchorEnd.getTime() ? anchorStart : anchorEnd;
    const rangeTo =
      anchorStart.getTime() <= anchorEnd.getTime() ? anchorEnd : anchorStart;
    const rangeStart = toApiDateTime(startOfMonth(rangeFrom));
    const rangeEnd = toApiDateTime(endOfMonth(rangeTo));
    fetchEvents(rangeStart, rangeEnd)
      .then(setLinkedEvents)
      .catch(() => setLinkedEvents([]));
  }, [showAddEventModal, startDate, endDate]);

  useEffect(() => {
    if (!showAddEventModal) {
      formSeedRef.current = null;
      return;
    }

    const seedKey = editEvent
      ? `event-${editEvent.id}`
      : editTask
        ? `task-${editTask.id}`
        : `create-${formatDateForInput(defaultDate)}`;

    if ((editEvent || editTask) && domains.length === 0) {
      return;
    }

    if (formSeedRef.current === seedKey) {
      return;
    }
    formSeedRef.current = seedKey;

    if (editEvent) {
      const form = eventReadToForm(editEvent, domains);
      setEntryType("event");
      setTitle(form.title);
      setDomain(form.domain);
      setStartDate(form.startDate);
      setEndDate(form.endDate);
      setStartTime(form.startTime);
      setEndTime(form.endTime);
      setAllDay(form.allDay);
      setIsRecurring(form.isRecurring);
      setRecurrenceWeekdays(form.recurrenceWeekdays);
      setRecurrenceUntil(form.recurrenceUntil);
      setTimezone(form.timezone);
      setLinkedEventId("");
      return;
    }

    if (editTask) {
      const form = taskReadToForm(editTask, domains);
      setEntryType("task");
      setTitle(form.title);
      setDomain(form.domain);
      setTaskDate(form.date);
      setStartTime(form.startTime);
      setEndTime("10:00");
      setAllDay(false);
      setIsRecurring(false);
      setLinkedEventId(form.linkedEventId);
      return;
    }

    const times = getDefaultTimes(defaultDate, new Date());
    setEntryType("event");
    setTitle("");
    setDomain("career");
    const day = formatDateForInput(defaultDate);
    setStartDate(day);
    setEndDate(day);
    setTaskDate(day);
    setStartTime(times.startTime);
    setEndTime(times.endTime);
    setAllDay(false);
    setIsRecurring(false);
    setRecurrenceWeekdays(["MO"]);
    setRecurrenceUntil(day);
    setTimezone(defaultTimezone());
    setLinkedEventId("");
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
        if (isRecurring && allDay) {
          setError("All-day recurring events are not supported yet");
          setSaving(false);
          return;
        }
        if (isRecurring && recurrenceWeekdays.length === 0) {
          setError("Select at least one weekday for recurrence");
          setSaving(false);
          return;
        }
        const form = {
          title,
          domain,
          startDate,
          endDate: isRecurring ? startDate : endDate,
          startTime,
          endTime,
          allDay,
          isRecurring,
          recurrenceWeekdays,
          recurrenceUntil,
          timezone,
        };
        const rangeError = validateEventFormRange(form);
        if (rangeError) {
          setError(rangeError);
          setSaving(false);
          return;
        }
        if (editEvent) {
          await updateEvent(editEvent.id, eventFormToUpdate(form, domainId));
        } else {
          await createEvent(eventFormToCreate(form, domainId));
        }
      } else {
        const form = { title, domain, date: taskDate, startTime, linkedEventId };
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
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-lg font-medium placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300"
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

            {entryType === "event" ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="startDate" className="mb-1 block text-gray-500">
                    Start date
                  </label>
                  <input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      const next = e.target.value;
                      setStartDate(next);
                      setEndDate((current) => (current < next ? next : current));
                    }}
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label htmlFor="endDate" className="mb-1 block text-gray-500">
                    End date
                  </label>
                  <input
                    id="endDate"
                    type="date"
                    value={endDate}
                    min={startDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label htmlFor="taskDate" className="mb-1 block text-gray-500">
                  Due on
                </label>
                <input
                  id="taskDate"
                  type="date"
                  value={taskDate}
                  onChange={(e) => setTaskDate(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
            )}

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
                  <span>Recurring event (weekly)</span>
                  <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                  />
                </label>
                {isRecurring && (
                  <div className="space-y-2 rounded-md border border-gray-200 p-3">
                    <div>
                      <span className="mb-1 block text-gray-500">Repeat on</span>
                      <div className="flex flex-wrap gap-2">
                        {WEEKDAY_CODES.map((code) => (
                          <label key={code} className="flex items-center gap-1 text-xs">
                            <input
                              type="checkbox"
                              checked={recurrenceWeekdays.includes(code)}
                              onChange={(e) => {
                                setRecurrenceWeekdays((current) => {
                                  if (e.target.checked) {
                                    return [...current, code];
                                  }
                                  return current.filter((day) => day !== code);
                                });
                              }}
                            />
                            {WEEKDAY_LABELS[code]}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label htmlFor="recurrenceUntil" className="mb-1 block text-gray-500">
                        Repeat until
                      </label>
                      <input
                        id="recurrenceUntil"
                        type="date"
                        value={recurrenceUntil}
                        min={startDate}
                        onChange={(e) => setRecurrenceUntil(e.target.value)}
                        className="w-full rounded-md border border-gray-300 px-3 py-2"
                      />
                    </div>
                    <div>
                      <label htmlFor="timezone" className="mb-1 block text-gray-500">
                        Timezone
                      </label>
                      <input
                        id="timezone"
                        type="text"
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="w-full rounded-md border border-gray-300 px-3 py-2"
                      />
                    </div>
                  </div>
                )}
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
              <div className="space-y-1">
                {editEvent?.is_recurring && (
                  <p className="text-xs text-gray-500">Edits and delete apply to the entire series.</p>
                )}
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={saving}
                  className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
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
