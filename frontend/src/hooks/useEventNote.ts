import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, fetchEventNote, upsertEventNote } from "../api";
import type { NoteEditorStatus } from "./noteStatus";
import { shouldApplyDailyNoteResponse } from "../utils/dailyNoteSync";

const AUTOSAVE_MS = 600;

function noteKey(eventId: number, occurrenceStartAt: string): string {
  return `${eventId}:${occurrenceStartAt}`;
}

export function useEventNote(eventId: number, occurrenceStartAt: string) {
  const scopeKey = noteKey(eventId, occurrenceStartAt);
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<NoteEditorStatus>("loading");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);

  const generationRef = useRef(0);
  const prevEventIdRef = useRef(eventId);
  const prevOccurrenceRef = useRef(occurrenceStartAt);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirtyRef = useRef(false);
  const contentRef = useRef(content);
  const serverUpdatedAtRef = useRef<string | null>(null);
  const eventIdRef = useRef(eventId);
  const occurrenceRef = useRef(occurrenceStartAt);

  contentRef.current = content;
  eventIdRef.current = eventId;
  occurrenceRef.current = occurrenceStartAt;

  const saveNote = useCallback(
    async (
      targetEventId: number,
      targetOccurrence: string,
      text: string,
      ifUpdatedAt: string | null,
      requestGeneration: number,
    ) => {
      const activeKey = noteKey(eventIdRef.current, occurrenceRef.current);
      const targetKey = noteKey(targetEventId, targetOccurrence);
      if (
        !shouldApplyDailyNoteResponse(
          activeKey,
          targetKey,
          generationRef.current,
          requestGeneration,
        ) &&
        targetKey === activeKey
      ) {
        return;
      }

      if (targetKey === activeKey) {
        setStatus("saving");
        setSaveError(null);
      }

      try {
        const result = await upsertEventNote(targetEventId, {
          content: text,
          occurrence_start_at: targetOccurrence,
          if_updated_at: ifUpdatedAt,
        });

        if (targetKey !== noteKey(eventIdRef.current, occurrenceRef.current)) {
          return;
        }
        if (
          !shouldApplyDailyNoteResponse(
            activeKey,
            targetKey,
            generationRef.current,
            requestGeneration,
          )
        ) {
          return;
        }

        serverUpdatedAtRef.current = result.updated_at;
        dirtyRef.current = false;
        setStatus("saved");
      } catch (error) {
        if (targetKey !== noteKey(eventIdRef.current, occurrenceRef.current)) {
          return;
        }
        if (
          !shouldApplyDailyNoteResponse(
            activeKey,
            targetKey,
            generationRef.current,
            requestGeneration,
          )
        ) {
          return;
        }

        if (error instanceof ApiError && error.status === 409) {
          try {
            const fresh = await fetchEventNote(targetEventId, targetOccurrence);
            if (
              !shouldApplyDailyNoteResponse(
                activeKey,
                targetKey,
                generationRef.current,
                requestGeneration,
              )
            ) {
              return;
            }
            setContent(fresh.content);
            serverUpdatedAtRef.current = fresh.updated_at;
            dirtyRef.current = false;
            setConflictMessage("Note updated elsewhere");
            setStatus("saved");
          } catch {
            setSaveError("Could not refresh note after conflict");
            setStatus("error");
          }
          return;
        }

        setSaveError(error instanceof Error ? error.message : "Save failed");
        setStatus("error");
      }
    },
    [],
  );

  const flushPendingSave = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    if (dirtyRef.current) {
      const flushGeneration = generationRef.current;
      void saveNote(
        eventIdRef.current,
        occurrenceRef.current,
        contentRef.current,
        serverUpdatedAtRef.current,
        flushGeneration,
      );
    }
  }, [saveNote]);

  useEffect(() => {
    const scopeChanged =
      prevEventIdRef.current !== eventId ||
      prevOccurrenceRef.current !== occurrenceStartAt;
    if (scopeChanged && dirtyRef.current) {
      const flushGeneration = generationRef.current;
      void saveNote(
        prevEventIdRef.current,
        prevOccurrenceRef.current,
        contentRef.current,
        serverUpdatedAtRef.current,
        flushGeneration,
      );
    }
    prevEventIdRef.current = eventId;
    prevOccurrenceRef.current = occurrenceStartAt;

    generationRef.current += 1;
    const loadGeneration = generationRef.current;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    setStatus("loading");
    setLoadError(null);
    setConflictMessage(null);
    setSaveError(null);

    let cancelled = false;
    void fetchEventNote(eventId, occurrenceStartAt)
      .then((note) => {
        if (cancelled) {
          return;
        }
        if (
          !shouldApplyDailyNoteResponse(
            scopeKey,
            scopeKey,
            generationRef.current,
            loadGeneration,
          )
        ) {
          return;
        }
        setContent(note.content);
        serverUpdatedAtRef.current = note.updated_at;
        dirtyRef.current = false;
        setStatus("idle");
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }
        if (
          !shouldApplyDailyNoteResponse(
            scopeKey,
            scopeKey,
            generationRef.current,
            loadGeneration,
          )
        ) {
          return;
        }
        setLoadError(error instanceof Error ? error.message : "Failed to load note");
        setStatus("error");
      });

    return () => {
      cancelled = true;
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [eventId, occurrenceStartAt, scopeKey, saveNote]);

  const onContentChange = useCallback(
    (next: string) => {
      setContent(next);
      dirtyRef.current = true;
      setConflictMessage(null);
      setStatus("idle");

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      const saveGeneration = generationRef.current;
      debounceRef.current = setTimeout(() => {
        void saveNote(
          eventId,
          occurrenceStartAt,
          next,
          serverUpdatedAtRef.current,
          saveGeneration,
        );
      }, AUTOSAVE_MS);
    },
    [eventId, occurrenceStartAt, saveNote],
  );

  return {
    content,
    onContentChange,
    status,
    loadError,
    saveError,
    conflictMessage,
    flushPendingSave,
  };
}
