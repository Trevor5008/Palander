export function CurrentHourIndicator() {
  return (
    <div className="absolute left-16 right-0 flex items-center">
      <div className="h-0.5 flex-1 bg-red-400" />
      <span className="px-2 text-xs text-red-500">now</span>
    </div>
  );
}
