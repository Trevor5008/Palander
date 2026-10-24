import { useMemo, useState } from "react";
import { CalendarGrid } from "../components/CalendarGrid";
import { CalendarHeader } from "../components/CalendarHeader";
import { useDomains } from "../hooks/useDomains";
import { useEntriesRange } from "../hooks/useEntriesRange";
import { useEventTaskModal } from "../hooks/useEventTaskModal";
import { EventModal } from "../modals/EventModal";
import { ScheduleImportModal } from "../modals/ScheduleImportModal";
import { endOfMonth, startOfMonth } from "../utils/apiMappers";
import { buildMonthGrid } from "../utils/calendar";
import { useSelectedDateParam } from "../hooks/useSelectedDateParam";
import { addMonths, startOfDay } from "../utils/date";

export function CalendarView() {
  const today = useMemo(() => startOfDay(new Date()), []);
  const { selectedDate: viewDate, setSelectedDate: setViewDate } = useSelectedDateParam();
  const [showImportModal, setShowImportModal] = useState(false);
  const domains = useDomains();

  const rangeStart = useMemo(() => startOfMonth(viewDate), [viewDate]);
  const rangeEnd = useMemo(() => endOfMonth(viewDate), [viewDate]);
  const { events, tasks, reload } = useEntriesRange(rangeStart, rangeEnd);

  // Build the month grid
  const cells = buildMonthGrid(viewDate, today);

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

  // Render the Calendar View component
  return (
    <section className="flex min-h-0 flex-1 flex-col pt-4">
      {/* Calendar header */}
      <CalendarHeader
        viewDate={viewDate}
        onPrevMonth={() => setViewDate(addMonths(viewDate, -1))}
        onNextMonth={() => setViewDate(addMonths(viewDate, 1))}
        onToday={() => setViewDate(today)}
        onAdd={() => openCreate(viewDate)}
        onImportSchedule={() => setShowImportModal(true)}
      />
      {/* Calendar grid */}
      <CalendarGrid
        cells={cells}
        events={events}
        tasks={tasks}
        domains={domains}
        onEditEvent={openEditEvent}
        onEditTask={openEditTask}
        onCreateForDay={openCreate}
      />

      {/* Event modal */}
      <ScheduleImportModal
        open={showImportModal}
        onClose={() => setShowImportModal(false)}
        domains={domains}
        onImported={reload}
      />

      {showModal && (
        <EventModal
          showAddEventModal={showModal}
          onClose={closeModal}
          defaultDate={modalDate}
          editEvent={editEvent}
          editTask={editTask}
          onSaved={reload}
          onDeleted={reload}
        />
      )}
    </section>
  );
}
