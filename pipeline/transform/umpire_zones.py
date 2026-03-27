"""Transform Statcast data into umpire zone accuracy and tendencies."""

import logging

import numpy as np
import pandas as pd

from pipeline.config import ZONE_H_MIN, ZONE_H_MAX, ZONE_H_BANDS, ZONE_V_MIN, ZONE_V_MAX, ZONE_V_BANDS

logger = logging.getLogger(__name__)

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
) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Compute umpire zone accuracy from called pitches (vectorized)."""
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

    # Umpires table: one row per game
    umpires_df = (
        called.groupby("game_pk")
        .size()
        .reset_index(name="_n")
        .rename(columns={"game_pk": "umpire_id"})
    )
    umpires_df["umpire_name"] = "Game " + umpires_df["umpire_id"].astype(str)
    umpires_df = umpires_df[ump_cols]

    # Zone stats per game
    zone_grp = called[called["zone_id"] > 0].groupby(["game_pk", "zone_id"])
    zone_agg = zone_grp.agg(
        cs=("is_called_strike", "sum"),
        n=("is_called_strike", "count"),
    ).reset_index()
    zone_agg["called_strike_pct"] = np.round(zone_agg["cs"] / zone_agg["n"] * 100, 1)
    zones_df = zone_agg.rename(columns={"game_pk": "umpire_id", "n": "sample_size"})
    zones_df["season"] = season
    zones_df = zones_df[zone_cols]

    # Overall stats per game
    game_grp = called.groupby("game_pk")
    game_agg = game_grp.agg(
        total=("is_correct", "count"),
        correct=("is_correct", "sum"),
    ).reset_index()
    game_agg["accuracy_pct"] = np.round(game_agg["correct"] / game_agg["total"] * 100, 1)

    # Expanded zone rate
    outside = called[~called["is_true_strike"]]
    expanded_agg = outside.groupby("game_pk")["is_called_strike"].agg(["sum", "count"]).reset_index()
    expanded_agg.columns = ["game_pk", "expanded_strikes", "outside_total"]
    expanded_agg["expanded_zone_rate"] = np.round(
        expanded_agg["expanded_strikes"] / expanded_agg["outside_total"] * 100, 1
    )

    stats_df = game_agg.merge(expanded_agg[["game_pk", "expanded_zone_rate"]], on="game_pk", how="left")
    stats_df = stats_df.rename(columns={"game_pk": "umpire_id"})
    stats_df["season"] = season
    stats_df["games"] = 1
    stats_df["consistency_rating"] = None  # Would need per-zone variance calc
    stats_df = stats_df[stat_cols]

    logger.info(
        "Umpire zones: %d games, %d zone records for season %d",
        len(umpires_df), len(zones_df), season,
    )
    return umpires_df, zones_df, stats_df
