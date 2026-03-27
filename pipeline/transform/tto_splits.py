"""Transform Statcast data into time-through-the-order splits for pitchers."""

import logging

import numpy as np
import pandas as pd

from pipeline.transform.woba import (
    PA_ENDING_EVENTS,
    NON_AB_EVENTS,
    HIT_EVENTS,
    compute_woba,
)

logger = logging.getLogger(__name__)


def _assign_tto(df: pd.DataFrame) -> pd.DataFrame:
    """Assign times-through-the-order (1/2/3) using cumcount within game+pitcher+batter."""
    df = df.sort_values(["game_pk", "at_bat_number"])
    # For each game+pitcher, count how many times each batter has appeared
    df["times_through"] = (
        df.groupby(["game_pk", "pitcher", "batter"]).cumcount() + 1
    ).clip(upper=3)
    return df


def transform_tto_splits(
    statcast_df: pd.DataFrame,
    season: int,
) -> pd.DataFrame:
    """Compute pitcher time-through-order splits."""
    columns = [
        "player_id", "season", "times_through",
        "pa", "ba", "slg", "woba", "k_pct", "bb_pct", "avg_exit_velo",
    ]

    if statcast_df is None or statcast_df.empty:
        return pd.DataFrame(columns=columns)

    df = statcast_df.copy()
    df = df[df["events"].notna() & df["events"].isin(PA_ENDING_EVENTS)]
    if df.empty:
        return pd.DataFrame(columns=columns)

    df = _assign_tto(df)

    records = []
    for (pitcher_id, tto), group in df.groupby(["pitcher", "times_through"]):
        if tto == 0:
            continue

        pa = len(group)
        events = group["events"]
        at_bats = events[~events.isin(NON_AB_EVENTS)]
        n_ab = len(at_bats)

        hits = at_bats[at_bats.isin(HIT_EVENTS)]
        ba = round(len(hits) / n_ab, 3) if n_ab > 0 else None

        total_bases = sum(HIT_EVENTS.get(e, 0) for e in at_bats)
        slg = round(total_bases / n_ab, 3) if n_ab > 0 else None

        woba = compute_woba(group)
        woba = round(woba, 3) if woba is not None else None

        strikeouts = events[events.str.contains("strikeout", case=False, na=False)]
        k_pct = round(len(strikeouts) / pa, 3) if pa > 0 else None

        walks = events[events.isin({"walk", "intent_walk"})]
        bb_pct = round(len(walks) / pa, 3) if pa > 0 else None

        exit_velos = group["launch_speed"].dropna()
        avg_exit_velo = round(float(exit_velos.mean()), 1) if not exit_velos.empty else None

        records.append({
            "player_id": int(pitcher_id),
            "season": season,
            "times_through": int(tto),
            "pa": pa,
            "ba": ba,
            "slg": slg,
            "woba": woba,
            "k_pct": k_pct,
            "bb_pct": bb_pct,
            "avg_exit_velo": avg_exit_velo,
        })

    result = pd.DataFrame(records)
    logger.info("TTO splits: %d rows for season %d", len(result), season)
    return result
