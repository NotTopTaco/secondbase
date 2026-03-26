"""Fetch player data from the MLB Stats API."""

import logging

import pandas as pd
import requests

from pipeline.config import MLB_API_BASE

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
