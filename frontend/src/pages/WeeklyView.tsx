import { useMemo, useState } from "react";
import { DateNavBar } from "../components/DateNavBar";
import { WeekTimeline } from "../components/WeekTimeline";
import { useDomains } from "../hooks/useDomains";
import { useEntriesRange } from "../hooks/useEntriesRange";
import { useEventTaskModal } from "../hooks/useEventTaskModal";
import { EventModal } from "../modals/EventModal";
import {
  addWeeks,
  endOfWeek,
  formatWeekRange,
  startOfDay,
  startOfWeek,
} from "../utils/date";

export function WeeklyView() {
  const [viewDate, setViewDate] = useState(() => startOfDay(new Date()));
  const domains = useDomains();

  const weekStart = useMemo(() => startOfWeek(viewDate), [viewDate]);
  const weekEnd = useMemo(() => endOfWeek(viewDate), [viewDate]);
  const { events, tasks, reload } = useEntriesRange(weekStart, weekEnd);

  const {
    showModal,
    editEvent,
    editTask,
    modalDate,
    openCreate,
    openEditEvent,
    openEditTask,
    closeModal,
  } = useEventTaskModal(viewDate);

  return (
    <section className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <DateNavBar
        label={formatWeekRange(weekStart, weekEnd)}
        onPrev={() => setViewDate((date) => addWeeks(date, -1))}
        onNext={() => setViewDate((date) => addWeeks(date, 1))}
        onToday={() => setViewDate(startOfDay(new Date()))}
        onAdd={() => openCreate(viewDate)}
        prevLabel="Previous week"
        nextLabel="Next week"
      />

      <WeekTimeline
        weekStart={weekStart}
        events={events}
        tasks={tasks}
        domains={domains}
        onEditEvent={openEditEvent}
        onEditTask={openEditTask}
      />

      <EventModal
        showAddEventModal={showModal}
        onClose={closeModal}
        defaultDate={modalDate}
        editEvent={editEvent}
        editTask={editTask}
        onSaved={reload}
        onDeleted={reload}
      />
    </section>
  );
}
