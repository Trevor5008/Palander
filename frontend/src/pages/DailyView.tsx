import { useMemo } from "react";
import { AllDayRow } from "../components/AllDayRow";
import { DailyExecutionPane } from "../components/DailyExecutionPane";
import { DateNavBar } from "../components/DateNavBar";
import { DayTimeline } from "../components/DayTimeline";
import { useDailyWorkspace } from "../hooks/useDailyWorkspace";
import { useDomains } from "../hooks/useDomains";
import { useEntriesRange } from "../hooks/useEntriesRange";
import { useEventTaskModal } from "../hooks/useEventTaskModal";
import { useObjectives } from "../hooks/useObjectives";
import { useSelectedDateParam } from "../hooks/useSelectedDateParam";
import { EventModal } from "../modals/EventModal";
import { endOfDay, partitionEvents } from "../utils/apiMappers";
import { addDays, formatDate, formatDateForInput } from "../utils/date";
import { getEventsForDay } from "../utils/eventSegments";

export function DailyView() {
  const { selectedDate, setSelectedDate } = useSelectedDateParam();
  const noteDateIso = useMemo(() => formatDateForInput(selectedDate), [selectedDate]);
  const domains = useDomains();
  const { objectives } = useObjectives();
  const workspace = useDailyWorkspace(noteDateIso);

  const rangeStart = useMemo(() => {
    const d = new Date(selectedDate);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [selectedDate]);
  const rangeEnd = useMemo(() => endOfDay(selectedDate), [selectedDate]);
  const { events, tasks, reload: reloadEntries } = useEntriesRange(rangeStart, rangeEnd);

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

  const domainsById = useMemo(
    () => new Map(domains.map((d) => [d.id, d.name])),
    [domains],
  );
  const objectivesById = useMemo(
    () => new Map(objectives.map((o) => [o.id, o.title])),
    [objectives],
  );

  function handleChanged() {
    void workspace.reload();
    void reloadEntries();
  }

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
            objectivesById={objectivesById}
            onEditEvent={openEditEvent}
          />
          <DayTimeline
            selectedDate={selectedDate}
            events={events}
            tasks={tasks}
            domains={domains}
            objectivesById={objectivesById}
            onEditEvent={openEditEvent}
            onEditTask={openEditTask}
          />
        </div>

        <div className="flex min-h-0 flex-col overflow-hidden border-t border-gray-200 lg:border-t-0 lg:border-l">
          <div className="shrink-0 border-b border-gray-200 px-4 py-2">
            <h2 className="text-sm font-semibold text-gray-800">Daily execution</h2>
          </div>
          <div className="min-h-0 flex-1">
          <DailyExecutionPane
            workspace={workspace.data}
            loading={workspace.loading}
            error={workspace.error}
            domainsById={domainsById}
            objectivesById={objectivesById}
            onChanged={handleChanged}
          />
          </div>
        </div>
      </div>

      <EventModal
        showAddEventModal={showModal}
        onClose={closeModal}
        defaultDate={modalDate}
        editEvent={editEvent}
        editTask={editTask}
        onSaved={handleChanged}
        onDeleted={handleChanged}
      />
    </section>
  );
}
