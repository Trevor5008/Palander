import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { NoteEditorStatus } from "../hooks/noteStatus";
import { noteStatusLabel } from "../hooks/noteStatus";

type MarkdownNoteEditorProps = {
  resetKey: string;
  content: string;
  onContentChange: (value: string) => void;
  status: NoteEditorStatus;
  loadError: string | null;
  saveError: string | null;
  conflictMessage: string | null;
  emptyPlaceholder?: string;
  header?: React.ReactNode;
  showModeToggle?: boolean;
};

export function MarkdownNoteEditor({
  resetKey,
  content,
  onContentChange,
  status,
  loadError,
  saveError,
  conflictMessage,
  emptyPlaceholder = "Nothing written yet. Click to add notes…",
  header,
  showModeToggle = true,
}: MarkdownNoteEditorProps) {
  const [mode, setMode] = useState<"edit" | "preview">("preview");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const statusText = noteStatusLabel(status);

  useEffect(() => {
    setMode("preview");
  }, [resetKey]);

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
    <>
      {(header || showModeToggle || statusText) && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-3 py-2">
          <div className="min-w-0 flex-1">{header}</div>
          <div className="flex items-center gap-2">
            {showModeToggle && (
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
            )}
            {statusText && (
              <span className="text-xs text-gray-500" aria-live="polite">
                {statusText}
              </span>
            )}
          </div>
        </div>
      )}

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
            className="h-full min-h-[10rem] w-full resize-none rounded-md border border-gray-200 px-3 py-2 font-mono text-sm leading-relaxed focus:border-blue-500 focus:outline-none disabled:bg-gray-50"
          />
        ) : (
          <button
            type="button"
            onClick={enterEdit}
            disabled={status === "loading"}
            className="min-h-[10rem] w-full cursor-text rounded-md border border-transparent px-1 py-1 text-left transition-colors hover:border-gray-200 hover:bg-gray-50/80 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Edit note"
          >
            <article className="prose prose-sm max-w-none prose-headings:font-semibold prose-a:text-blue-600">
              {content.trim() ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
              ) : (
                <p className="text-gray-500 not-prose">{emptyPlaceholder}</p>
              )}
            </article>
          </button>
        )}
      </div>
    </>
  );
}
