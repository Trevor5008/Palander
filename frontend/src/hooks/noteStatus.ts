export type NoteEditorStatus = "loading" | "idle" | "saving" | "saved" | "error";

export function noteStatusLabel(status: NoteEditorStatus): string {
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
