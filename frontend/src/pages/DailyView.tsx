import { useMemo, useState } from "react";
import { AllDayRow } from "../components/AllDayRow";
import { DateNavBar } from "../components/DateNavBar";
import { DayTimeline } from "../components/DayTimeline";
import { useDomains } from "../hooks/useDomains";
import { useEntriesRange } from "../hooks/useEntriesRange";
import { useEventTaskModal } from "../hooks/useEventTaskModal";
import { EventModal } from "../modals/EventModal";
import { endOfDay, partitionEvents } from "../utils/apiMappers";
import { getEventsForDay } from "../utils/eventSegments";
import { addDays, formatDate, startOfDay } from "../utils/date";

export function DailyView() {
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));
  const domains = useDomains();

  const rangeStart = useMemo(() => startOfDay(selectedDate), [selectedDate]);
  const rangeEnd = useMemo(() => endOfDay(selectedDate), [selectedDate]);
  const { events, tasks, reload } = useEntriesRange(rangeStart, rangeEnd);

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

  const dayEvents = getEventsForDay(events, selectedDate);
  const { allDay } = partitionEvents(dayEvents);

  return (
    <section className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <DateNavBar
        label={formatDate(selectedDate)}
        onPrev={() => setSelectedDate((date) => addDays(date, -1))}
        onNext={() => setSelectedDate((date) => addDays(date, 1))}
        onToday={() => setSelectedDate(startOfDay(new Date()))}
        onAdd={() => openCreate(selectedDate)}
        prevLabel="Previous day"
        nextLabel="Next day"
      />

      <AllDayRow events={allDay} domains={domains} onEditEvent={openEditEvent} />

      <DayTimeline
        selectedDate={selectedDate}
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
