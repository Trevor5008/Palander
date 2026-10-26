from datetime import datetime, timezone

from app.models.task import Task


def apply_task_status_change(task: Task, new_status: str) -> None:
    previous = task.status
    task.status = new_status
    if new_status == "completed" and previous != "completed":
        task.completed_at = datetime.now(timezone.utc)
    elif new_status == "active" and previous == "completed":
        task.completed_at = None
    elif new_status == "cancelled":
        task.completed_at = None
