from datetime import date

from pydantic import BaseModel

from app.schemas.task import TaskRead


class DomainCoverageItem(BaseModel):
    domain_id: int
    domain_name: str
    scheduled_event_minutes: int
    planned_task_count: int
    planned_task_minutes: int = 0


class ObjectiveActivityItem(BaseModel):
    objective_id: int
    objective_title: str
    domain_id: int
    planned_task_count: int
    completed_task_count: int
    scheduled_event_count: int = 0
    scheduled_event_minutes: int = 0


class DailyWorkspaceRead(BaseModel):
    date: date
    today: list[TaskRead]
    overdue: list[TaskRead]
    completed: list[TaskRead]
    domain_coverage: list[DomainCoverageItem]
    objective_activity: list[ObjectiveActivityItem]
