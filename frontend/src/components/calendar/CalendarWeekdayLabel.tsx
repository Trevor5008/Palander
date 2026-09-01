// Calendar Weekday Label component props
type CalendarWeekdayLabelProps = {
  label: string;
};

// Calendar Weekday Label component
export function CalendarWeekdayLabel({ label }: CalendarWeekdayLabelProps) {
  // Render the Calendar Weekday Label component
  return (
    <div className="bg-gray-100 px-2 py-2 text-center text-xs font-medium text-gray-500">
      {label}
    </div>
  );
}
