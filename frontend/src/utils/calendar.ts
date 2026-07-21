export type CalendarCell = {
  key: string;
  day: number | null;
  isCurrentMonth: boolean;
  isToday: boolean;
};

function dateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function buildMonthGrid(viewDate: Date, today: Date = new Date()): CalendarCell[] {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayKey = dateKey(today.getFullYear(), today.getMonth(), today.getDate());

  const cells: CalendarCell[] = [];

  for (let i = 0; i < firstWeekday; i++) {
    cells.push({
      key: `${year}-${month}-pad-before-${i}`,
      day: null,
      isCurrentMonth: false,
      isToday: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const key = dateKey(year, month, day);
    cells.push({
      key,
      day,
      isCurrentMonth: true,
      isToday: key === todayKey,
    });
  }

  let trailing = 0;
  while (cells.length % 7 !== 0) {
    cells.push({
      key: `${year}-${month}-pad-after-${trailing++}`,
      day: null,
      isCurrentMonth: false,
      isToday: false,
    });
  }

  return cells;
}

export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}
