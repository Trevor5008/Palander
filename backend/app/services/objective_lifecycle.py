from datetime import datetime, timezone

from app.models.objective import Objective

TERMINAL_OBJECTIVE_STATUSES = frozenset({"completed", "cancelled"})


def apply_objective_status_change(objective: Objective, new_status: str) -> None:
    previous = objective.status
    objective.status = new_status
    if new_status in TERMINAL_OBJECTIVE_STATUSES and previous not in TERMINAL_OBJECTIVE_STATUSES:
        objective.completed_at = datetime.now(timezone.utc)
    elif new_status in {"active", "paused"}:
        objective.completed_at = None
