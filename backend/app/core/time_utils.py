from datetime import datetime, timezone, timedelta
from zoneinfo import ZoneInfo
from typing import Optional


def now_utc() -> datetime:
    """Return timezone-aware current UTC time."""
    return datetime.now(timezone.utc)


def to_utc(dt: datetime) -> datetime:
    """Ensure a datetime is timezone-aware in UTC.

    - If naive, treat as UTC (no conversion).
    - If aware, convert to UTC.
    """
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def from_zone(zone_name: str) -> ZoneInfo:
    """Get a ZoneInfo for a given IANA zone name (e.g., 'Asia/Kolkata')."""
    return ZoneInfo(zone_name)


def now_in_zone(zone_name: str) -> datetime:
    """Return timezone-aware current time in a given IANA zone."""
    return datetime.now(ZoneInfo(zone_name))


def add_minutes(dt: datetime, minutes: int) -> datetime:
    """Add minutes to a datetime (preserves tz awareness)."""
    return dt + timedelta(minutes=minutes)
