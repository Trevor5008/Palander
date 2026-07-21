export type HourSlot = {
  hour: number;
  label: string;
};

export const HOUR_SLOTS: HourSlot[] = Array.from({ length: 24 }, (_, hour) => {
  const display = hour % 12 || 12;
  const period = hour < 12 ? "am" : "pm";
  return { hour, label: `${display}${period}` };
});
