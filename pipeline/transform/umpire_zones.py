"""Transform Statcast data into umpire zone accuracy and tendencies."""

import logging

import numpy as np
import pandas as pd

from pipeline.config import ZONE_H_MIN, ZONE_H_MAX, ZONE_H_BANDS, ZONE_V_MIN, ZONE_V_MAX, ZONE_V_BANDS

logger = logging.getLogger(__name__)

# True strike zone boundaries (MLB rulebook: ~17 inches wide)
ZONE_LEFT = -0.83
ZONE_RIGHT = 0.83
ZONE_BOTTOM = 1.5
ZONE_TOP = 3.5

_H_BAND_WIDTH = (ZONE_H_MAX - ZONE_H_MIN) / ZONE_H_BANDS
_V_BAND_WIDTH = (ZONE_V_MAX - ZONE_V_MIN) / ZONE_V_BANDS


def _vectorized_zone(plate_x: pd.Series, plate_z: pd.Series) -> pd.Series:
    col = ((plate_x - ZONE_H_MIN) / _H_BAND_WIDTH).astype(int).clip(0, ZONE_H_BANDS - 1)
    row = ((plate_z - ZONE_V_MIN) / _V_BAND_WIDTH).astype(int).clip(0, ZONE_V_BANDS - 1)
    zone_id = row * ZONE_H_BANDS + col + 1
    outside = (
        (plate_x < ZONE_H_MIN) | (plate_x > ZONE_H_MAX)
        | (plate_z < ZONE_V_MIN) | (plate_z > ZONE_V_MAX)
        | plate_x.isna() | plate_z.isna()
    )
    return zone_id.where(~outside, 0).astype(int)


def transform_umpire_zones(
    statcast_df: pd.DataFrame,
    season: int,
    umpire_df: pd.DataFrame | None = None,
) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Compute umpire zone accuracy from called pitches.

    Parameters
    ----------
    statcast_df : pd.DataFrame
        Raw Statcast pitch-level data.
    season : int
        Season year.
    umpire_df : pd.DataFrame, optional
        Umpire assignments with columns: game_pk, umpire_id, umpire_name.
        If None, falls back to per-game grouping (legacy behavior).
    """
    ump_cols = ["umpire_id", "umpire_name"]
    zone_cols = ["umpire_id", "season", "zone_id", "called_strike_pct", "sample_size"]
    stat_cols = ["umpire_id", "season", "games", "accuracy_pct", "expanded_zone_rate", "consistency_rating"]

    empty = (
        pd.DataFrame(columns=ump_cols),
        pd.DataFrame(columns=zone_cols),
        pd.DataFrame(columns=stat_cols),
    )

    if statcast_df is None or statcast_df.empty:
        return empty

    df = statcast_df.copy()
    called = df[df["description"].isin({"called_strike", "ball"})]
    called = called[called["plate_x"].notna() & called["plate_z"].notna()].copy()
    if called.empty:
        return empty

    # Join with umpire assignments if available
    if umpire_df is not None and not umpire_df.empty:
        called = called.merge(
            umpire_df[["game_pk", "umpire_id", "umpire_name"]],
            on="game_pk",
            how="inner",
        )
        if called.empty:
            logger.warning("No called pitches matched umpire assignments")
            return empty
        group_col = "umpire_id"
    else:
        # Legacy fallback: group by game_pk
        logger.warning(
            "No umpire assignments provided; falling back to per-game grouping"
        )
        called["umpire_id"] = called["game_pk"]
        called["umpire_name"] = "Game " + called["game_pk"].astype(str)
        group_col = "umpire_id"

    called["zone_id"] = _vectorized_zone(called["plate_x"], called["plate_z"])
    called["is_true_strike"] = (
        (called["plate_x"] >= ZONE_LEFT) & (called["plate_x"] <= ZONE_RIGHT)
        & (called["plate_z"] >= ZONE_BOTTOM) & (called["plate_z"] <= ZONE_TOP)
    )
    called["is_called_strike"] = called["description"] == "called_strike"
    called["is_correct"] = (
        (called["is_true_strike"] & called["is_called_strike"])
        | (~called["is_true_strike"] & ~called["is_called_strike"])
    )

    # --- Umpires table: one row per umpire ---
    umpires_df = (
        called.groupby("umpire_id")
        .agg(umpire_name=("umpire_name", "first"))
        .reset_index()
    )
    umpires_df = umpires_df[ump_cols]

    # --- Zone stats: per-umpire, per-zone ---
    zone_grp = called[called["zone_id"] > 0].groupby([group_col, "zone_id"])
    zone_agg = zone_grp.agg(
        cs=("is_called_strike", "sum"),
        n=("is_called_strike", "count"),
    ).reset_index()
    zone_agg["called_strike_pct"] = np.round(zone_agg["cs"] / zone_agg["n"] * 100, 1)
    zones_df = zone_agg.rename(columns={group_col: "umpire_id", "n": "sample_size"})
    zones_df["season"] = season
    zones_df = zones_df[zone_cols]

    # --- Overall stats: per-umpire across all games ---
    game_grp = called.groupby([group_col, "game_pk"])
    umpire_games = called.groupby(group_col)["game_pk"].nunique().reset_index()
    umpire_games.columns = [group_col, "games"]

    overall_grp = called.groupby(group_col)
    overall_agg = overall_grp.agg(
        total=("is_correct", "count"),
        correct=("is_correct", "sum"),
    ).reset_index()
    overall_agg["accuracy_pct"] = np.round(
        overall_agg["correct"] / overall_agg["total"] * 100, 1
    )

    # Expanded zone rate: called strikes on pitches outside the true zone
    outside = called[~called["is_true_strike"]]
    expanded_agg = (
        outside.groupby(group_col)["is_called_strike"]
        .agg(["sum", "count"])
        .reset_index()
    )
    expanded_agg.columns = [group_col, "expanded_strikes", "outside_total"]
    expanded_agg["expanded_zone_rate"] = np.round(
        expanded_agg["expanded_strikes"] / expanded_agg["outside_total"] * 100, 1
    )

    # Consistency rating: 100 - std_dev of per-zone called_strike_pct
    # Lower variance = more consistent = higher rating
    zone_pcts = zones_df.groupby("umpire_id")["called_strike_pct"].std().reset_index()
    zone_pcts.columns = ["umpire_id", "zone_std"]
    zone_pcts["consistency_rating"] = np.round(
        (100.0 - zone_pcts["zone_std"].fillna(0).clip(upper=100)), 1
    )

    stats_df = overall_agg.rename(columns={group_col: "umpire_id"})
    stats_df = stats_df.merge(umpire_games.rename(columns={group_col: "umpire_id"}), on="umpire_id", how="left")
    stats_df = stats_df.merge(
        expanded_agg[[group_col, "expanded_zone_rate"]].rename(columns={group_col: "umpire_id"}),
        on="umpire_id",
        how="left",
    )
    stats_df = stats_df.merge(
        zone_pcts[["umpire_id", "consistency_rating"]],
        on="umpire_id",
        how="left",
    )
    stats_df["season"] = season
    stats_df = stats_df[stat_cols]

    logger.info(
        "Umpire zones: %d umpires, %d zone records for season %d",
        len(umpires_df), len(zones_df), season,
    )
    return umpires_df, zones_df, stats_df
