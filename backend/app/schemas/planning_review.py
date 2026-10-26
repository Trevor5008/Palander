from datetime import date, datetime

from pydantic import BaseModel, Field

from app.schemas.task import TaskRead


class DomainAllocationItem(BaseModel):
    domain_id: int
    domain_name: str
    scheduled_event_minutes: int
    tasks_planned: int
    tasks_completed: int


class ObjectiveWarningItem(BaseModel):
    objective_id: int
    objective_title: str
    domain_id: int
    warning_type: str
    message: str


class WeeklyReviewRead(BaseModel):
    week_start: date
    week_end: date
    domain_allocation: list[DomainAllocationItem]
    carry_forward: list[TaskRead]
    objective_warnings: list[ObjectiveWarningItem]


class CompletedObjectiveItem(BaseModel):
    objective_id: int
    title: str
    domain_id: int
    completed_at: datetime


class ObjectiveWeeklyActivity(BaseModel):
    objective_id: int
    objective_title: str
    domain_id: int
    week_start: date
    planned_task_count: int
    completed_task_count: int


class DomainWeeklyCompletions(BaseModel):
    domain_id: int
    domain_name: str
    week_start: date
    completed_task_count: int


class PlanningProgressRead(BaseModel):
    weeks: int
    recently_completed_objectives: list[CompletedObjectiveItem]
    objective_weekly_activity: list[ObjectiveWeeklyActivity]
    domain_weekly_completions: list[DomainWeeklyCompletions]


class CarryForwardItem(BaseModel):
    task_id: int
    planned_for: date


class CarryForwardRequest(BaseModel):
    items: list[CarryForwardItem] = Field(..., min_length=1)


class CarryForwardResult(BaseModel):
    updated: int
