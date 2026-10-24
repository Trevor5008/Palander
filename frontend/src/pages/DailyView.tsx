import { useMemo } from "react";
import { AllDayRow } from "../components/AllDayRow";
import { DailyNotePane } from "../components/DailyNotePane";
import { DateNavBar } from "../components/DateNavBar";
import { DayTimeline } from "../components/DayTimeline";
import { useDailyNote } from "../hooks/useDailyNote";
import { useDomains } from "../hooks/useDomains";
import { useEntriesRange } from "../hooks/useEntriesRange";
import { useEventTaskModal } from "../hooks/useEventTaskModal";
import { useSelectedDateParam } from "../hooks/useSelectedDateParam";
import { EventModal } from "../modals/EventModal";
import { endOfDay, partitionEvents } from "../utils/apiMappers";
import { addDays, formatDate, formatDateForInput } from "../utils/date";
import { getEventsForDay } from "../utils/eventSegments";

export function DailyView() {
  const { selectedDate, setSelectedDate } = useSelectedDateParam();
  const noteDateIso = useMemo(() => formatDateForInput(selectedDate), [selectedDate]);
  const domains = useDomains();
  const dailyNote = useDailyNote(noteDateIso);

  const rangeStart = useMemo(() => {
    const d = new Date(selectedDate);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [selectedDate]);
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
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white">
      <DateNavBar
        label={formatDate(selectedDate)}
        onPrev={() => setSelectedDate(addDays(selectedDate, -1))}
        onNext={() => setSelectedDate(addDays(selectedDate, 1))}
        onToday={() => setSelectedDate(new Date())}
        onAdd={() => openCreate(selectedDate)}
        prevLabel="Previous day"
        nextLabel="Next day"
      />

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[2fr_3fr]">
        <div className="flex min-h-0 min-w-0 flex-col overflow-hidden">
          <AllDayRow events={allDay} domains={domains} onEditEvent={openEditEvent} />
          <DayTimeline
            selectedDate={selectedDate}
            events={events}
            tasks={tasks}
            domains={domains}
            onEditEvent={openEditEvent}
            onEditTask={openEditTask}
          />
        </div>

        <DailyNotePane
          noteDateLabel={formatDate(selectedDate)}
          content={dailyNote.content}
          onContentChange={dailyNote.onContentChange}
          status={dailyNote.status}
          loadError={dailyNote.loadError}
          saveError={dailyNote.saveError}
          conflictMessage={dailyNote.conflictMessage}
        />
      </div>

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
