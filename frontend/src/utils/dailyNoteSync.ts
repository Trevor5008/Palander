export function shouldApplyDailyNoteResponse(
  activeDateIso: string,
  requestDateIso: string,
  activeGeneration: number,
  requestGeneration: number,
): boolean {
  return activeDateIso === requestDateIso && activeGeneration === requestGeneration;
}
