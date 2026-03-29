"""Fetch player and umpire data from the MLB Stats API."""

import logging
import time
from datetime import datetime, timedelta
from pathlib import Path

import pandas as pd
import requests

from pipeline.config import MLB_API_BASE, RAW_DIR

logger = logging.getLogger(__name__)

_HEADSHOT_TEMPLATE = (
    "https://img.mlbstatic.com/mlb-photos/image/upload/"
    "d_people:generic:headshot:67:current.png/"
    "w_213,q_auto:best/v1/people/{id}/headshot/67/current"
)


def fetch_all_players(season: int) -> pd.DataFrame:
    """Fetch all active MLB players for the given season from the Stats API.

    GET /sports/1/players?season={season}

    Returns a DataFrame with columns:
        player_id, full_name, team, position, bats, throws, headshot_url
    """
    url = f"{MLB_API_BASE}/sports/1/players"
    params = {"season": season}

    logger.info("Fetching players for season %d from MLB Stats API", season)

    try:
        resp = requests.get(url, params=params, timeout=30)
        resp.raise_for_status()
    except requests.RequestException:
        logger.exception("Failed to fetch players from MLB Stats API")
        return pd.DataFrame()

    data = resp.json()
    people = data.get("people", [])
    if not people:
        logger.warning("No players returned for season %d", season)
        return pd.DataFrame()

    records = []
    for p in people:
        player_id = p.get("id")
        records.append(
            {
                "player_id": player_id,
                "full_name": p.get("fullName", ""),
                "team": (p.get("currentTeam") or {}).get("name", ""),
                "position": (p.get("primaryPosition") or {}).get("abbreviation", ""),
                "bats": (p.get("batSide") or {}).get("code", ""),
                "throws": (p.get("pitchHand") or {}).get("code", ""),
                "headshot_url": _HEADSHOT_TEMPLATE.format(id=player_id),
            }
        )

    df = pd.DataFrame(records)
    logger.info("Fetched %d players for season %d", len(df), season)
    return df


def fetch_umpire_assignments(
    season: int,
    start_date: str,
    end_date: str,
) -> pd.DataFrame:
    """Fetch home-plate umpire assignments for games in the date range.

    Uses the MLB schedule endpoint with official hydration to get umpire
    data in bulk. Caches results as a Parquet file.

    Returns a DataFrame with columns: game_pk, umpire_id, umpire_name
    """
    cache_file = RAW_DIR / f"umpire_assignments_{season}.parquet"

    # Use cache if fresh (24 hours)
    if cache_file.exists():
        age_hours = (time.time() - cache_file.stat().st_mtime) / 3600
        if age_hours < 24.0:
            logger.info("Umpire assignments cache hit for season %d", season)
            return pd.read_parquet(cache_file)

    logger.info(
        "Fetching umpire assignments for %s to %s", start_date, end_date
    )

    records: list[dict] = []

    # Fetch in 30-day chunks to avoid huge API responses
    current = datetime.strptime(start_date, "%Y-%m-%d")
    end = datetime.strptime(end_date, "%Y-%m-%d")

    while current <= end:
        chunk_end = min(current + timedelta(days=29), end)
        cs = current.strftime("%Y-%m-%d")
        ce = chunk_end.strftime("%Y-%m-%d")

        url = f"{MLB_API_BASE}/schedule"
        params = {
            "sportId": 1,
            "startDate": cs,
            "endDate": ce,
            "hydrate": "officials",
        }

        try:
            resp = requests.get(url, params=params, timeout=60)
            resp.raise_for_status()
            data = resp.json()

            for date_entry in data.get("dates", []):
                for game in date_entry.get("games", []):
                    game_pk = game.get("gamePk")
                    if not game_pk:
                        continue

                    officials = game.get("officials", [])
                    for official in officials:
                        if official.get("officialType") == "Home Plate":
                            person = official.get("official", {})
                            ump_id = person.get("id")
                            ump_name = person.get("fullName", "")
                            if ump_id:
                                records.append({
                                    "game_pk": int(game_pk),
                                    "umpire_id": int(ump_id),
                                    "umpire_name": ump_name,
                                })
                            break
        except requests.RequestException:
            logger.exception(
                "Failed to fetch umpire assignments for %s to %s", cs, ce
            )

        current = chunk_end + timedelta(days=1)

    if not records:
        logger.warning("No umpire assignments found for season %d", season)
        return pd.DataFrame(columns=["game_pk", "umpire_id", "umpire_name"])

    df = pd.DataFrame(records)
    df.to_parquet(cache_file, index=False)
    logger.info(
        "Fetched %d umpire assignments for season %d", len(df), season
    )
    return df
