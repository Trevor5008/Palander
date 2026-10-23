from dataclasses import dataclass


@dataclass(frozen=True)
class FormatIssue:
    line_number: int
    snippet: str
    code: str
    message: str
    help_section: str = "plain"
