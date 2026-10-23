import { useCallback, useState } from "react";
import { fetchEvent } from "../api";
import type { EventRead, TaskRead } from "../types/api";
import { startOfDay } from "../utils/date";

export function useEventTaskModal(initialDate: Date = new Date()) {
  const [showModal, setShowModal] = useState(false);
  const [editEvent, setEditEvent] = useState<EventRead | null>(null);
  const [editTask, setEditTask] = useState<TaskRead | null>(null);
  const [modalDate, setModalDate] = useState(() => startOfDay(initialDate));

  const openCreate = useCallback((date?: Date) => {
    setEditEvent(null);
    setEditTask(null);
    if (date) setModalDate(startOfDay(date));
    setShowModal(true);
  }, []);

  const openEditEvent = useCallback((event: EventRead) => {
    setEditTask(null);
    setModalDate(startOfDay(new Date(event.start_at)));
    void fetchEvent(event.id)
      .then((master) => {
        setEditEvent(master);
        setShowModal(true);
      })
      .catch(() => {
        setEditEvent(event);
        setShowModal(true);
      });
  }, []);

  const openEditTask = useCallback((task: TaskRead) => {
    setEditTask(task);
    setEditEvent(null);
    setModalDate(startOfDay(new Date(task.due_date)));
    setShowModal(true);
  }, []);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setEditEvent(null);
    setEditTask(null);
  }, []);

  return {
    showModal,
    editEvent,
    editTask,
    modalDate,
    openCreate,
    openEditEvent,
    openEditTask,
    closeModal,
  };
}
