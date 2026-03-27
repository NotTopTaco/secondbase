"""Transform Statcast data into per-batter defensive alignment summaries."""

import logging

import numpy as np
import pandas as pd

from pipeline.transform.woba import PA_ENDING_EVENTS

logger = logging.getLogger(__name__)

# Statcast home plate X coordinate (catcher's view)
_HP_X = 125.42


def transform_defensive_alignment(
    statcast_df: pd.DataFrame,
    season: int,
) -> pd.DataFrame:
    """One row per batter with alignment frequency and spray direction stats."""
    logger.info("Transforming defensive alignment for season %d", season)

    if statcast_df is None or statcast_df.empty:
        logger.warning("Empty statcast DataFrame")
        return pd.DataFrame()

    # Work with PA-ending events for alignment data
    pa_df = statcast_df[statcast_df["events"].isin(PA_ENDING_EVENTS)].copy()
    if pa_df.empty:
        return pd.DataFrame()

    rows = []
    for batter_id, group in pa_df.groupby("batter"):
        total_pa = len(group)
        if total_pa < 10:
            continue

        # Infield alignment
        if_col = "if_fielding_alignment"
        if if_col in group.columns:
            if_vals = group[if_col].dropna()
            if_total = len(if_vals)
            if if_total > 0:
                if_standard = (if_vals == "Standard").sum() / if_total * 100
                if_shade = (if_vals == "Infield shade").sum() / if_total * 100
                if_strategic = (if_vals == "Strategic").sum() / if_total * 100
            else:
                if_standard = if_shade = if_strategic = None
        else:
            if_standard = if_shade = if_strategic = None

        # Outfield alignment
        of_col = "of_fielding_alignment"
        if of_col in group.columns:
            of_vals = group[of_col].dropna()
            of_total = len(of_vals)
            if of_total > 0:
                of_standard = (of_vals == "Standard").sum() / of_total * 100
                of_strategic = (of_vals == "Strategic").sum() / of_total * 100
            else:
                of_standard = of_strategic = None
        else:
            of_standard = of_strategic = None

        # Spray direction from batted balls with coordinates
        batted = group.dropna(subset=["hc_x", "hc_y"])
        if len(batted) >= 5:
            dx = batted["hc_x"] - _HP_X
            threshold = 30
            pull = (dx < -threshold).sum()
            center = ((dx >= -threshold) & (dx <= threshold)).sum()
            oppo = (dx > threshold).sum()
            total_batted = len(batted)
            pull_pct = pull / total_batted * 100
            center_pct = center / total_batted * 100
            oppo_pct = oppo / total_batted * 100
        else:
            pull_pct = center_pct = oppo_pct = None

        rows.append({
            "player_id": int(batter_id),
            "season": season,
            "if_standard_pct": if_standard,
            "if_shade_pct": if_shade,
            "if_strategic_pct": if_strategic,
            "of_standard_pct": of_standard,
            "of_strategic_pct": of_strategic,
            "total_pa": total_pa,
            "pull_pct": pull_pct,
            "center_pct": center_pct,
            "oppo_pct": oppo_pct,
        })

    df = pd.DataFrame(rows)
    logger.info("Defensive alignment: %d batters", len(df))
    return df
