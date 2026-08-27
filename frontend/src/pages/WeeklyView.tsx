import { useMemo, useState } from "react";
import { AllDayRow } from "../components/AllDayRow";
import { DateNavBar } from "../components/DateNavBar";
import { DayTimeline } from "../components/DayTimeline";
import { WeekStrip } from "../components/WeekStrip";
import { useDomains } from "../hooks/useDomains";
import { useEntriesRange } from "../hooks/useEntriesRange";
import { useEventTaskModal } from "../hooks/useEventTaskModal";
import { EventModal } from "../modals/EventModal";
import { isSameApiDay, partitionEvents } from "../utils/apiMappers";
import {
  addWeeks,
  endOfWeek,
  formatWeekRange,
  startOfDay,
  startOfWeek,
} from "../utils/date";

export function WeeklyView() {
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));
  const domains = useDomains();

  const weekStart = useMemo(() => startOfWeek(selectedDate), [selectedDate]);
  const weekEnd = useMemo(() => endOfWeek(selectedDate), [selectedDate]);
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
  } = useEventTaskModal(selectedDate);

  const dayEvents = events.filter((e) => isSameApiDay(e.start_at, selectedDate));
  const { allDay } = partitionEvents(dayEvents);

  return (
    <section className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <DateNavBar
        label={formatWeekRange(weekStart, weekEnd)}
        onPrev={() => setSelectedDate((date) => addWeeks(date, -1))}
        onNext={() => setSelectedDate((date) => addWeeks(date, 1))}
        onToday={() => setSelectedDate(startOfDay(new Date()))}
        onAdd={() => openCreate(selectedDate)}
        prevLabel="Previous week"
        nextLabel="Next week"
      />

      <WeekStrip
        weekStart={weekStart}
        selectedDate={selectedDate}
        events={events}
        tasks={tasks}
        onSelectDate={setSelectedDate}
      />

      <AllDayRow events={allDay} domains={domains} onEditEvent={openEditEvent} />

      <DayTimeline
        selectedDate={selectedDate}
        events={events}
        tasks={tasks}
        domains={domains}
        onEditEvent={openEditEvent}
        onEditTask={openEditTask}
        showDayName={false}
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
