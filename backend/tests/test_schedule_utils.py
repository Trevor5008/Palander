from app.utils.schedule_plain_line import parse_plain_schedule_line
from app.utils.schedule_time import normalize_time_token
from app.utils.schedule_weekdays import resolve_weekday_token


def test_normalize_time_variants():
    assert normalize_time_token("09:00") == "09:00"
    assert normalize_time_token("0900") == "09:00"
    assert normalize_time_token("1145") == "11:45"
    assert normalize_time_token("900") == "09:00"


def test_resolve_single_letter_weekdays():
    assert resolve_weekday_token("M") == "MO"
    assert resolve_weekday_token("W") == "WE"
    assert resolve_weekday_token("R") == "TH"
    assert resolve_weekday_token("T") == "TU"


def test_parse_space_delimited_plain_line():
    parsed = parse_plain_schedule_line("Chemistry Lab M W 0900 1145")
    assert parsed.title == "Chemistry Lab"
    assert parsed.weekdays == ["MO", "WE"]
    assert parsed.start_time == "09:00"
    assert parsed.end_time == "11:45"


def test_parse_legacy_plain_line():
    parsed = parse_plain_schedule_line("Chemistry Lab Mon,Wed 09:00-10:30")
    assert parsed.title == "Chemistry Lab"
    assert parsed.weekdays == ["MO", "WE"]
    assert parsed.start_time == "09:00"
    assert parsed.end_time == "10:30"
