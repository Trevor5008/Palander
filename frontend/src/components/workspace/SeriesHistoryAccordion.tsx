import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { upsertEventNote } from "../../api";
import type { SeriesNoteStackItem } from "../../types/api";
import type { NoteEditorStatus } from "../../hooks/noteStatus";

type SeriesHistoryAccordionProps = {
  eventId: number;
  title: string;
  items: SeriesNoteStackItem[];
  loading: boolean;
  error: string | null;
};

function formatOccurrenceLabel(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function HistoryRow({
  eventId,
  item,
}: {
  eventId: number;
  item: SeriesNoteStackItem;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(item.content);
  const [, setStatus] = useState<NoteEditorStatus>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  const save = async () => {
    setStatus("saving");
    setSaveError(null);
    try {
      await upsertEventNote(eventId, {
        content,
        occurrence_start_at: item.occurrence_start_at,
        if_updated_at: item.updated_at,
      });
      setStatus("saved");
      setEditing(false);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Save failed");
      setStatus("error");
    }
  };

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-50"
      >
        <span className="font-medium text-gray-800">
          {open ? "▼" : "▶"} {formatOccurrenceLabel(item.occurrence_start_at)}
        </span>
      </button>
      {open && (
        <div className="border-t border-gray-100 px-3 pb-3">
          {editing ? (
            <div className="space-y-2">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[8rem] w-full rounded-md border border-gray-200 px-2 py-2 font-mono text-xs"
              />
              {saveError && <p className="text-xs text-red-600">{saveError}</p>}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void save()}
                  className="rounded bg-gray-800 px-2 py-1 text-xs text-white"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setContent(item.content);
                  }}
                  className="rounded border border-gray-200 px-2 py-1 text-xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <article className="prose prose-sm max-w-none py-2">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {item.content.trim() || "_Empty note_"}
                </ReactMarkdown>
              </article>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="text-xs font-medium text-blue-700 hover:underline"
              >
                Expand to edit
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function SeriesHistoryAccordion({
  eventId,
  title,
  items,
  loading,
  error,
}: SeriesHistoryAccordionProps) {
  if (loading) {
    return (
      <p className="border-t border-gray-200 px-3 py-2 text-xs text-gray-500">
        Loading series history…
      </p>
    );
  }
  if (error) {
    return (
      <p className="border-t border-gray-200 px-3 py-2 text-xs text-red-600" role="alert">
        {error}
      </p>
    );
  }
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="border-t border-gray-200">
      <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        Series history ({title}) — {items.length} prior
      </p>
      <div className="max-h-64 overflow-y-auto">
        {items.map((item) => (
          <HistoryRow
            key={item.occurrence_start_at}
            eventId={eventId}
            item={item}
          />
        ))}
      </div>
    </div>
  );
}
