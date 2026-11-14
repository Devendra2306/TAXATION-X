import re
from datetime import date, datetime
from typing import Optional, Union


def current_assessment_year(for_date: Optional[Union[date, datetime]] = None) -> str:
    """
    Returns the Indian Income Tax Assessment Year (AY) for the filing season of a given date.
    Under Indian tax law, the financial year runs from April 1 to March 31.
    The Assessment Year is the year following the financial year.
    For example:
      - Nov 2026 -> "2026-27" (filing season for FY 2025-26)
      - Jan 2027 -> "2026-27" (filing season for FY 2025-26)
      - Apr 2027 -> "2027-28" (filing season for FY 2026-27)
    """
    if for_date is None:
        for_date = date.today()
    elif isinstance(for_date, datetime):
        for_date = for_date.date()

    year = for_date.year
    month = for_date.month

    if month >= 4:
        ay_start = year
        ay_end = (year + 1) % 100
    else:
        ay_start = year - 1
        ay_end = year % 100

    return f"{ay_start}-{ay_end:02d}"


def validate_assessment_year(ay: str) -> str:
    """
    Validates that the assessment year is in the format YYYY-YY and that
    the second part equals (first_year + 1) % 100.
    Raises ValueError if invalid.
    """
    if not isinstance(ay, str):
        raise ValueError("assessment_year must be a string in YYYY-YY format.")

    ay = ay.strip()
    if not re.match(r"^\d{4}-\d{2}$", ay):
        raise ValueError(f"Invalid assessment year format '{ay}'. Expected format YYYY-YY (e.g. '2026-27').")

    y1 = int(ay[:4])
    y2 = int(ay[5:])
    expected_y2 = (y1 + 1) % 100

    if y2 != expected_y2:
        raise ValueError(
            f"Invalid assessment year '{ay}'. The suffix must be {expected_y2:02d} for start year {y1} (e.g. '{y1}-{expected_y2:02d}')."
        )

    return ay


def parse_assessment_year_start(ay: str) -> str:
    """
    Extracts the 4-digit start year from an assessment year string.
    e.g. '2026-27' -> '2026'
    """
    validated = validate_assessment_year(ay)
    return validated[:4]
