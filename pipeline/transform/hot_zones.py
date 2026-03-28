"""Transform Statcast data into per-batter hot-zone stats (5x5 grid)."""

import logging
from datetime import datetime, timedelta

import pandas as pd

from pipeline.transform.zones import assign_zone
from pipeline.transform.woba import compute_ba, compute_slg, compute_woba

logger = logging.getLogger(__name__)

# Events relevant for zone analysis: batted balls and called strikes
_BATTED_BALL_EVENTS = {
    "single",
    "double",
    "triple",
    "home_run",
    "field_out",
    "grounded_into_double_play",
    "force_out",
    "fielders_choice",
    "fielders_choice_out",
    "double_play",
    "field_error",
    "sac_fly",
    "sac_fly_double_play",
    "triple_play",
    "sac_bunt",
    "sac_bunt_double_play",
}

_CALLED_STRIKE_DESCRIPTIONS = {"called_strike"}

_PA_RELEVANT_DESCRIPTIONS = {
    "swinging_strike",
    "swinging_strike_blocked",
    "foul",
    "foul_tip",
    "hit_into_play",
    "hit_into_play_score",
    "hit_into_play_no_out",
    "called_strike",
    "foul_bunt",
    "missed_bunt",
    "bunt_foul_tip",
}


def _filter_by_period(df: pd.DataFrame, period: str) -> pd.DataFrame:
    """Filter the DataFrame by the specified period."""
    if period == "season" or period == "career":
        return df

    if period == "last30":
        if "game_date" not in df.columns:
            return df
        df = df.copy()
        df["game_date"] = pd.to_datetime(df["game_date"], errors="coerce")
        max_date = df["game_date"].max()
        if pd.isna(max_date):
            return df
        cutoff = max_date - timedelta(days=30)
        return df[df["game_date"] >= cutoff]

    return df


def transform_hot_zones(
    statcast_df: pd.DataFrame,
    season: int,
    period: str = "season",
) -> pd.DataFrame:
    """Compute per-batter, per-zone wOBA/BA/SLG from Statcast data.

    Parameters
    ----------
    statcast_df : pd.DataFrame
        Raw Statcast pitch-level data.
    season : int
        Season year for the output records.
    period : str
        One of 'season', 'last30', 'career'.

    Returns
    -------
    pd.DataFrame
        Columns: player_id, season, period, zone_id, woba, ba, slg, sample_size
    """
    if statcast_df is None or statcast_df.empty:
        return pd.DataFrame(
            columns=[
                "player_id", "season", "period", "zone_id",
                "woba", "ba", "slg", "sample_size",
            ]
        )

    df = statcast_df.copy()
    df = _filter_by_period(df, period)

    if df.empty:
        return pd.DataFrame(
            columns=[
                "player_id", "season", "period", "zone_id",
                "woba", "ba", "slg", "sample_size",
            ]
        )

    # Filter to meaningful zone events: batted balls and called strikes
    has_batted = df["events"].isin(_BATTED_BALL_EVENTS) if "events" in df.columns else pd.Series(False, index=df.index)
    has_called = df["description"].isin(_CALLED_STRIKE_DESCRIPTIONS) if "description" in df.columns else pd.Series(False, index=df.index)
    has_swing = df["description"].isin(_PA_RELEVANT_DESCRIPTIONS) if "description" in df.columns else pd.Series(False, index=df.index)
    df = df[has_batted | has_called | has_swing]

    if df.empty:
        return pd.DataFrame(
            columns=[
                "player_id", "season", "period", "zone_id",
                "woba", "ba", "slg", "sample_size",
            ]
        )

    # Assign zones
    df["zone_id"] = df.apply(
        lambda r: assign_zone(r.get("plate_x"), r.get("plate_z")), axis=1
    )

    # Drop pitches outside the grid
    df = df[df["zone_id"] > 0]

    if df.empty:
        return pd.DataFrame(
            columns=[
                "player_id", "season", "period", "zone_id",
                "woba", "ba", "slg", "sample_size",
            ]
        )

    records = []
    for (batter_id, zone_id), group in df.groupby(["batter", "zone_id"]):
        ba = compute_ba(group)
        slg = compute_slg(group)
        woba = compute_woba(group)
        sample_size = len(group)

        records.append(
            {
                "player_id": int(batter_id),
                "season": season,
                "period": period,
                "zone_id": int(zone_id),
                "woba": round(woba, 3) if woba is not None else None,
                "ba": round(ba, 3) if ba is not None else None,
                "slg": round(slg, 3) if slg is not None else None,
                "sample_size": sample_size,
            }
        )

    result = pd.DataFrame(records)
    logger.info(
        "Hot zones: %d batter-zone combos for season %d, period=%s",
        len(result),
        season,
        period,
    )
    return result
