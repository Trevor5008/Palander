import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { formatDateForInput, parseDateInput, startOfDay } from "../utils/date";

const DATE_PARAM = "date";

function parseDateParam(value: string | null): Date {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return startOfDay(new Date());
  }
  const parsed = parseDateInput(value);
  if (Number.isNaN(parsed.getTime())) {
    return startOfDay(new Date());
  }
  return startOfDay(parsed);
}

export function useSelectedDateParam() {
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedDate = useMemo(
    () => parseDateParam(searchParams.get(DATE_PARAM)),
    [searchParams],
  );

  const setSelectedDate = useCallback(
    (date: Date) => {
      const next = startOfDay(date);
      const params = new URLSearchParams(searchParams);
      params.set(DATE_PARAM, formatDateForInput(next));
      setSearchParams(params, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const dateSearch = searchParams.toString();

  return { selectedDate, setSelectedDate, dateSearch };
}
