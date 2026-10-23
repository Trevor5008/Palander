from difflib import SequenceMatcher

from app.models.event import Event


def find_duplicate_event_id(event: Event, candidates_title: str, weekdays: list[str]) -> int | None:
    ratio = SequenceMatcher(None, event.title.lower(), candidates_title.lower()).ratio()
    if ratio < 0.82:
        return None
    if not event.is_recurring or not event.rrule:
        return event.id
    upper = event.rrule.upper()
    if all(day in upper for day in weekdays):
        return event.id
    return None


def mark_duplicates(candidates, events: list[Event]) -> None:
    for candidate in candidates:
        for event in events:
            duplicate_id = find_duplicate_event_id(event, candidate.title, candidate.weekdays)
            if duplicate_id is not None:
                candidate.duplicate_of_event_id = duplicate_id
                candidate.warnings.append(f"Possible duplicate of event #{duplicate_id}")
                break
