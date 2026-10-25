import { useMemo, useRef, useState } from "react";
import { AllDayRow } from "../components/AllDayRow";
import { DailyNotePane } from "../components/DailyNotePane";
import { DateNavBar } from "../components/DateNavBar";
import { DayTimeline } from "../components/DayTimeline";
import { EntityNoteEditor } from "../components/workspace/EntityNoteEditor";
import { WorkspaceHeader } from "../components/workspace/WorkspaceHeader";
import { useDailyNote } from "../hooks/useDailyNote";
import { useDomains } from "../hooks/useDomains";
import { useEntriesRange } from "../hooks/useEntriesRange";
import { useEventTaskModal } from "../hooks/useEventTaskModal";
import { useSelectedDateParam } from "../hooks/useSelectedDateParam";
import { EventModal } from "../modals/EventModal";
import type { EventRead } from "../types/api";
import { endOfDay, partitionEvents } from "../utils/apiMappers";
import { addDays, formatDate, formatDateForInput } from "../utils/date";
import { getEventsForDay } from "../utils/eventSegments";
import { eventOccurrenceKey } from "../utils/recurrence";

type WorkspaceContext =
  | { kind: "daily" }
  | { kind: "event"; event: EventRead };

export function DailyView() {
  const { selectedDate, setSelectedDate } = useSelectedDateParam();
  const noteDateIso = useMemo(() => formatDateForInput(selectedDate), [selectedDate]);
  const domains = useDomains();
  const dailyNote = useDailyNote(noteDateIso);
  const eventFlushRef = useRef<(() => void) | null>(null);
  const [workspaceContext, setWorkspaceContext] = useState<WorkspaceContext>({
    kind: "daily",
  });

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

  const selectedEventKey =
    workspaceContext.kind === "event"
      ? eventOccurrenceKey(workspaceContext.event)
      : null;

  const selectDaily = () => {
    eventFlushRef.current?.();
    setWorkspaceContext({ kind: "daily" });
  };

  const selectEvent = (event: EventRead) => {
    dailyNote.flushPendingSave();
    eventFlushRef.current?.();
    setWorkspaceContext({ kind: "event", event });
  };

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
          <AllDayRow
            events={allDay}
            domains={domains}
            selectedEventKey={selectedEventKey}
            onSelectEvent={selectEvent}
            onEditEvent={openEditEvent}
          />
          <DayTimeline
            selectedDate={selectedDate}
            events={events}
            tasks={tasks}
            domains={domains}
            selectedEventKey={selectedEventKey}
            onSelectEvent={selectEvent}
            onEditEvent={openEditEvent}
            onEditTask={openEditTask}
          />
        </div>

        <div className="flex min-h-0 flex-col overflow-hidden border-t border-gray-200 lg:border-t-0 lg:border-l">
          <WorkspaceHeader
            dailyActive={workspaceContext.kind === "daily"}
            eventTitle={
              workspaceContext.kind === "event" ? workspaceContext.event.title : null
            }
            onSelectDaily={selectDaily}
            onCloseEvent={selectDaily}
          />
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {workspaceContext.kind === "daily" ? (
              <DailyNotePane
                noteDateLabel={formatDate(selectedDate)}
                content={dailyNote.content}
                onContentChange={dailyNote.onContentChange}
                status={dailyNote.status}
                loadError={dailyNote.loadError}
                saveError={dailyNote.saveError}
                conflictMessage={dailyNote.conflictMessage}
              />
            ) : (
              <EntityNoteEditor
                key={eventOccurrenceKey(workspaceContext.event)}
                event={workspaceContext.event}
                flushRef={eventFlushRef}
              />
            )}
          </div>
        </div>
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
