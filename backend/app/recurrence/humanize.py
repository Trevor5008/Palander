_DAY_LABELS = {
    "MO": "Monday",
    "TU": "Tuesday",
    "WE": "Wednesday",
    "TH": "Thursday",
    "FR": "Friday",
    "SA": "Saturday",
    "SU": "Sunday",
}


def humanize_rrule(rrule: str, tz_name: str) -> str:
    del tz_name
    upper = rrule.upper()
    if "BYDAY=" not in upper:
        return "Weekly recurring event"
    byday_part = upper.split("BYDAY=")[1].split(";")[0]
    days = [_DAY_LABELS.get(code.strip(), code.strip()) for code in byday_part.split(",")]
    day_text = ", ".join(days)
    until_text = ""
    if "UNTIL=" in upper:
        until_raw = upper.split("UNTIL=")[1].split(";")[0]
        until_text = f" until {until_raw[:8]}"
    return f"Every week on {day_text}{until_text}"
