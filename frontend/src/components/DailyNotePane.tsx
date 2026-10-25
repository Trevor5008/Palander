import { MarkdownNoteEditor } from "./MarkdownNoteEditor";
import type { NoteEditorStatus } from "../hooks/noteStatus";

type DailyNotePaneProps = {
  noteDateLabel: string;
  content: string;
  onContentChange: (value: string) => void;
  status: NoteEditorStatus;
  loadError: string | null;
  saveError: string | null;
  conflictMessage: string | null;
};

export function DailyNotePane({
  noteDateLabel,
  content,
  onContentChange,
  status,
  loadError,
  saveError,
  conflictMessage,
}: DailyNotePaneProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <MarkdownNoteEditor
        resetKey={noteDateLabel}
        content={content}
        onContentChange={onContentChange}
        status={status}
        loadError={loadError}
        saveError={saveError}
        conflictMessage={conflictMessage}
        header={
          <>
            <h2 className="text-sm font-semibold text-gray-800">Daily note</h2>
            <p className="text-xs text-gray-500">{noteDateLabel}</p>
          </>
        }
      />
    </div>
  );
}
