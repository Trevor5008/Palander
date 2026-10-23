from app.schedule.parser import RawCandidate


def merge_raw_candidates(groups: list[list[RawCandidate]]) -> list[RawCandidate]:
    best: dict[tuple[str, tuple[str, ...], str | None], RawCandidate] = {}
    for rows in groups:
        for raw in rows:
            key = (
                raw.title.strip().lower(),
                tuple(sorted(raw.weekdays)),
                raw.start_time,
            )
            existing = best.get(key)
            if existing is None or raw.confidence > existing.confidence:
                best[key] = raw
    return list(best.values())
