import logging

from app.schedule.format_issues import FormatIssue
from app.schedule.heuristic_parser import HeuristicScheduleParser
from app.schedule.merge import merge_raw_candidates
from app.schedule.parser import ParseContext, ScheduleParseResult, ScheduleParser
from app.schedule.table_parser import TableScheduleParser

logger = logging.getLogger(__name__)

CONFIDENCE_THRESHOLD = 0.35


def _merge_issues(groups: list[list[FormatIssue]]) -> list[FormatIssue]:
    seen: set[tuple[int, str]] = set()
    merged: list[FormatIssue] = []
    for issues in groups:
        for issue in issues:
            key = (issue.line_number, issue.code)
            if key in seen:
                continue
            seen.add(key)
            merged.append(issue)
    return merged


class CompositeScheduleParser:
    def __init__(self) -> None:
        self._heuristic = HeuristicScheduleParser()
        self._table = TableScheduleParser()

    async def parse(self, text: str, context: ParseContext) -> ScheduleParseResult:
        hint = context.format_hint
        if hint == "plain":
            result = await self._heuristic.parse(text, context)
            logger.info(
                "schedule_parse parser=heuristic candidates=%s format_hint=plain",
                len(result.candidates),
            )
            return result
        if hint == "csv":
            result = await self._table.parse(text, context)
            logger.info(
                "schedule_parse parser=table candidates=%s format_hint=csv",
                len(result.candidates),
            )
            return result

        heuristic_result = await self._heuristic.parse(text, context)
        table_result = await self._table.parse(text, context)
        merged = merge_raw_candidates([heuristic_result.candidates, table_result.candidates])
        issues = _merge_issues([heuristic_result.format_issues, table_result.format_issues])
        if not merged and not issues and text.strip():
            issues = [
                FormatIssue(
                    line_number=0,
                    snippet="",
                    code="NO_ROWS_EXTRACTED",
                    message="No schedule rows were recognized. Open format help for examples.",
                    help_section="plain",
                )
            ]
        logger.info(
            "schedule_parse parser=composite candidates=%s format_hint=auto",
            len(merged),
        )
        return ScheduleParseResult(candidates=merged, format_issues=issues)
