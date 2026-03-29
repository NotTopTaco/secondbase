"""Fetch Statcast data from Baseball Savant via pybaseball.

Downloads data in configurable chunks and caches as Parquet files.
"""

import logging
import time
from datetime import datetime, timedelta
from pathlib import Path

import pandas as pd

from pipeline.config import FETCH_CHUNK_DAYS, RAW_DIR

logger = logging.getLogger(__name__)


def _chunk_dates(start_date: str, end_date: str, chunk_days: int):
    """Yield (chunk_start, chunk_end) string pairs covering the full range."""
    start = datetime.strptime(start_date, "%Y-%m-%d")
    end = datetime.strptime(end_date, "%Y-%m-%d")
    current = start
    while current <= end:
        chunk_end = min(current + timedelta(days=chunk_days - 1), end)
        yield current.strftime("%Y-%m-%d"), chunk_end.strftime("%Y-%m-%d")
        current = chunk_end + timedelta(days=1)


def _cache_path(chunk_start: str, chunk_end: str) -> Path:
    """Return the Parquet cache file path for a given date chunk."""
    return RAW_DIR / f"statcast_{chunk_start}_{chunk_end}.parquet"


def _cache_is_fresh(path: Path, max_age_hours: float = 24.0) -> bool:
    """Return True if the cached file exists and is less than max_age_hours old."""
    if not path.exists():
        return False
    age = time.time() - path.stat().st_mtime
    return age < max_age_hours * 3600


def fetch_statcast(
    start_date: str, end_date: str, strict: bool = False
) -> pd.DataFrame:
    """Download Statcast data for the given date range.

    Data is fetched in chunks of FETCH_CHUNK_DAYS days at a time.
    Each chunk is cached as a Parquet file in data/raw/.
    If a cached Parquet exists and is less than 24 hours old, the download
    for that chunk is skipped.

    Parameters
    ----------
    start_date : str
        Start date in YYYY-MM-DD format.
    end_date : str
        End date in YYYY-MM-DD format.
    strict : bool
        If True, raise on any chunk failure instead of skipping.
        Use for incremental runs where every chunk matters.

    Returns
    -------
    pd.DataFrame
        Combined Statcast data for the full date range.
    """
    from pybaseball import statcast  # deferred import to keep module lightweight

    frames: list[pd.DataFrame] = []
    chunks = list(_chunk_dates(start_date, end_date, FETCH_CHUNK_DAYS))

    for i, (cs, ce) in enumerate(chunks, 1):
        cache_file = _cache_path(cs, ce)

        if _cache_is_fresh(cache_file):
            logger.info(
                "  [%d/%d] Cache hit for %s to %s", i, len(chunks), cs, ce
            )
            df = pd.read_parquet(cache_file)
        else:
            logger.info(
                "  [%d/%d] Fetching Statcast: %s to %s", i, len(chunks), cs, ce
            )
            try:
                df = statcast(start_dt=cs, end_dt=ce)
            except Exception:
                logger.exception("  Failed to fetch chunk %s to %s", cs, ce)
                if strict:
                    raise RuntimeError(
                        f"Failed to fetch Statcast chunk {cs} to {ce} "
                        "(strict mode). Aborting to prevent incomplete data."
                    )
                continue

            if df is not None and not df.empty:
                df.to_parquet(cache_file, index=False)
                logger.info(
                    "    Cached %d rows -> %s", len(df), cache_file.name
                )
            else:
                logger.warning("  No data returned for %s to %s", cs, ce)
                if strict:
                    raise RuntimeError(
                        f"No data returned for chunk {cs} to {ce} "
                        "(strict mode). Aborting to prevent incomplete data."
                    )
                continue

        frames.append(df)

    if not frames:
        logger.warning("No Statcast data fetched for %s to %s", start_date, end_date)
        return pd.DataFrame()

    combined = pd.concat(frames, ignore_index=True)
    logger.info(
        "Fetched %d total rows for %s to %s", len(combined), start_date, end_date
    )
    return combined


def load_cached_statcast(season: int) -> pd.DataFrame:
    """Load all cached Parquet files for a season without fetching.

    Reads statcast_{season}-*.parquet files from data/raw/ and concatenates
    them. Returns an empty DataFrame if no files are found.
    """
    pattern = f"statcast_{season}-*.parquet"
    files = sorted(RAW_DIR.glob(pattern))

    if not files:
        logger.warning("No cached Parquet files found for season %d", season)
        return pd.DataFrame()

    frames = [pd.read_parquet(f) for f in files]
    combined = pd.concat(frames, ignore_index=True)
    logger.info(
        "Loaded %d rows from %d cached files for season %d",
        len(combined), len(files), season,
    )
    return combined
