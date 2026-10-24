import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { DailyNoteStatus } from "../hooks/useDailyNote";

type DailyNotePaneProps = {
  noteDateLabel: string;
  content: string;
  onContentChange: (value: string) => void;
  status: DailyNoteStatus;
  loadError: string | null;
  saveError: string | null;
  conflictMessage: string | null;
};

function statusLabel(status: DailyNoteStatus): string {
  switch (status) {
    case "loading":
      return "Loading note…";
    case "saving":
      return "Saving…";
    case "saved":
      return "Saved";
    case "error":
      return "Error";
    default:
      return "";
  }
}

export function DailyNotePane({
  noteDateLabel,
  content,
  onContentChange,
  status,
  loadError,
  saveError,
  conflictMessage,
}: DailyNotePaneProps) {
  const [mode, setMode] = useState<"edit" | "preview">("preview");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const statusText = statusLabel(status);

  useEffect(() => {
    setMode("preview");
  }, [noteDateLabel]);

  useEffect(() => {
    if (mode === "edit") {
      textareaRef.current?.focus();
    }
  }, [mode]);

  const enterEdit = () => {
    if (status === "loading") {
      return;
    }
    setMode("edit");
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col border-t border-gray-200 lg:border-t-0 lg:border-l">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-3 py-2">
        <div>
          <h2 className="text-sm font-semibold text-gray-800">Daily note</h2>
          <p className="text-xs text-gray-500">{noteDateLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border border-gray-200 p-0.5 text-xs">
            <button
              type="button"
              onClick={enterEdit}
              className={`rounded px-2 py-1 ${mode === "edit" ? "bg-gray-800 text-white" : "text-gray-600"}`}
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => setMode("preview")}
              className={`rounded px-2 py-1 ${mode === "preview" ? "bg-gray-800 text-white" : "text-gray-600"}`}
            >
              Preview
            </button>
          </div>
          {statusText && (
            <span className="text-xs text-gray-500" aria-live="polite">
              {statusText}
            </span>
          )}
        </div>
      </div>

      {loadError && (
        <p className="border-b border-red-100 bg-red-50 px-3 py-2 text-xs text-red-800" role="alert">
          {loadError}
        </p>
      )}
      {conflictMessage && (
        <p className="border-b border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {conflictMessage}
        </p>
      )}
      {saveError && (
        <p className="border-b border-red-100 bg-red-50 px-3 py-2 text-xs text-red-800" role="alert">
          {saveError}
        </p>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {mode === "edit" ? (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(event) => onContentChange(event.target.value)}
            onBlur={() => setMode("preview")}
            disabled={status === "loading"}
            placeholder="Markdown: headings, lists, - [ ] checkboxes, links…"
            className="h-full min-h-[12rem] w-full resize-none rounded-md border border-gray-200 px-3 py-2 font-mono text-sm leading-relaxed focus:border-blue-500 focus:outline-none disabled:bg-gray-50 lg:min-h-[20rem]"
          />
        ) : (
          <button
            type="button"
            onClick={enterEdit}
            disabled={status === "loading"}
            className="min-h-[12rem] w-full cursor-text rounded-md border border-transparent px-1 py-1 text-left transition-colors hover:border-gray-200 hover:bg-gray-50/80 disabled:cursor-not-allowed disabled:opacity-60 lg:min-h-[20rem]"
            aria-label="Edit daily note"
          >
            <article className="prose prose-sm max-w-none prose-headings:font-semibold prose-a:text-blue-600">
              {content.trim() ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
              ) : (
                <p className="text-gray-500 not-prose">
                  Nothing written yet. Click to add notes…
                </p>
              )}
            </article>
          </button>
        )}
      </div>
    </div>
  );
}
