import { useEffect } from "react";
import type { EventRead } from "../../types/api";
import { useEventNote } from "../../hooks/useEventNote";
import { useSeriesNotes } from "../../hooks/useSeriesNotes";
import { MarkdownNoteEditor } from "../MarkdownNoteEditor";
import { SeriesHistoryAccordion } from "./SeriesHistoryAccordion";

type EntityNoteEditorProps = {
  event: EventRead;
  flushRef?: React.MutableRefObject<(() => void) | null>;
};

function formatOccurrenceRange(event: EventRead): string {
  const start = new Date(event.start_at);
  const end = new Date(event.end_at);
  const dateLabel = start.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timeFmt: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit" };
  return `${dateLabel} (${start.toLocaleTimeString(undefined, timeFmt)} – ${end.toLocaleTimeString(undefined, timeFmt)})`;
}

export function EntityNoteEditor({ event, flushRef }: EntityNoteEditorProps) {
  const occurrenceStartAt = event.start_at;
  const note = useEventNote(event.id, occurrenceStartAt);
  const showSeries = event.is_recurring || event.series_id != null;
  const series = useSeriesNotes(event.id, occurrenceStartAt, showSeries);

  useEffect(() => {
    if (!flushRef) {
      return;
    }
    flushRef.current = note.flushPendingSave;
    return () => {
      flushRef.current = null;
    };
  }, [flushRef, note.flushPendingSave]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <MarkdownNoteEditor
        resetKey={`${event.id}:${occurrenceStartAt}`}
        content={note.content}
        onContentChange={note.onContentChange}
        status={note.status}
        loadError={note.loadError}
        saveError={note.saveError}
        conflictMessage={note.conflictMessage}
        header={
          <>
            <h2 className="text-sm font-semibold text-gray-800">{event.title}</h2>
            <p className="text-xs text-gray-500">
              Today&apos;s note: {formatOccurrenceRange(event)}
            </p>
          </>
        }
      />
      {showSeries && (
        <SeriesHistoryAccordion
          eventId={event.id}
          title={event.title}
          items={series.items}
          loading={series.loading}
          error={series.error}
        />
      )}
    </div>
  );
}
