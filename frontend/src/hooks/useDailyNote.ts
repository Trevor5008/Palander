import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, fetchDailyNote, upsertDailyNote } from "../api";
import type { NoteEditorStatus } from "./noteStatus";
import { shouldApplyDailyNoteResponse } from "../utils/dailyNoteSync";

const AUTOSAVE_MS = 600;

export type DailyNoteStatus = NoteEditorStatus;

export function useDailyNote(noteDateIso: string) {
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<DailyNoteStatus>("loading");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);

  const generationRef = useRef(0);
  const prevDateIsoRef = useRef(noteDateIso);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirtyRef = useRef(false);
  const contentRef = useRef(content);
  const serverUpdatedAtRef = useRef<string | null>(null);

  contentRef.current = content;

  const saveNote = useCallback(
    async (dateIso: string, text: string, ifUpdatedAt: string | null, requestGeneration: number) => {
      const activeGeneration = generationRef.current;
      if (
        !shouldApplyDailyNoteResponse(
          noteDateIso,
          dateIso,
          activeGeneration,
          requestGeneration,
        ) &&
        dateIso === noteDateIso
      ) {
        return;
      }

      if (dateIso === noteDateIso) {
        setStatus("saving");
        setSaveError(null);
      }

      try {
        const result = await upsertDailyNote(dateIso, {
          content: text,
          if_updated_at: ifUpdatedAt,
        });

        if (dateIso !== noteDateIso) {
          return;
        }
        if (
          !shouldApplyDailyNoteResponse(
            noteDateIso,
            dateIso,
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
        if (dateIso !== noteDateIso) {
          return;
        }
        if (
          !shouldApplyDailyNoteResponse(
            noteDateIso,
            dateIso,
            generationRef.current,
            requestGeneration,
          )
        ) {
          return;
        }

        if (error instanceof ApiError && error.status === 409) {
          try {
            const fresh = await fetchDailyNote(dateIso);
            if (
              !shouldApplyDailyNoteResponse(
                noteDateIso,
                dateIso,
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
    [noteDateIso],
  );

  useEffect(() => {
    const previousDate = prevDateIsoRef.current;
    if (previousDate !== noteDateIso && dirtyRef.current) {
      const flushGeneration = generationRef.current;
      void saveNote(
        previousDate,
        contentRef.current,
        serverUpdatedAtRef.current,
        flushGeneration,
      );
    }
    prevDateIsoRef.current = noteDateIso;

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
    void fetchDailyNote(noteDateIso)
      .then((note) => {
        if (cancelled) {
          return;
        }
        if (
          !shouldApplyDailyNoteResponse(
            noteDateIso,
            noteDateIso,
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
            noteDateIso,
            noteDateIso,
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
  }, [noteDateIso, saveNote]);

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
          noteDateIso,
          next,
          serverUpdatedAtRef.current,
          saveGeneration,
        );
      }, AUTOSAVE_MS);
    },
    [noteDateIso, saveNote],
  );

  const flushPendingSave = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    if (dirtyRef.current) {
      const flushGeneration = generationRef.current;
      void saveNote(
        noteDateIso,
        contentRef.current,
        serverUpdatedAtRef.current,
        flushGeneration,
      );
    }
  }, [noteDateIso, saveNote]);

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
