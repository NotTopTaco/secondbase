"""Transform Statcast data into pitcher count-based tendency profiles for next-pitch prediction."""

import json
import logging

import numpy as np
import pandas as pd

from pipeline.config import ZONE_H_MIN, ZONE_H_MAX, ZONE_H_BANDS, ZONE_V_MIN, ZONE_V_MAX, ZONE_V_BANDS

logger = logging.getLogger(__name__)

_H_BAND_WIDTH = (ZONE_H_MAX - ZONE_H_MIN) / ZONE_H_BANDS
_V_BAND_WIDTH = (ZONE_V_MAX - ZONE_V_MIN) / ZONE_V_BANDS


def _vectorized_zone(plate_x: pd.Series, plate_z: pd.Series) -> pd.Series:
    """Vectorized zone assignment — much faster than row-by-row apply."""
    col = ((plate_x - ZONE_H_MIN) / _H_BAND_WIDTH).astype(int).clip(0, ZONE_H_BANDS - 1)
    row = ((plate_z - ZONE_V_MIN) / _V_BAND_WIDTH).astype(int).clip(0, ZONE_V_BANDS - 1)
    zone_id = row * ZONE_H_BANDS + col + 1

    # Zero out zones for pitches outside the grid
    outside = (
        (plate_x < ZONE_H_MIN) | (plate_x > ZONE_H_MAX)
        | (plate_z < ZONE_V_MIN) | (plate_z > ZONE_V_MAX)
        | plate_x.isna() | plate_z.isna()
    )
    zone_id = zone_id.where(~outside, 0)
    return zone_id.astype(int)


def _zone_dist_json(zone_ids: pd.Series) -> str:
    """Build zone distribution JSON from a series of zone IDs."""
    valid = zone_ids[zone_ids > 0]
    if valid.empty:
        return "{}"
    counts = valid.value_counts()
    total = counts.sum()
    dist = {str(int(z)): round(c / total * 100, 1) for z, c in counts.items()}
    return json.dumps(dist)


def transform_next_pitch(
    statcast_df: pd.DataFrame,
    season: int,
) -> pd.DataFrame:
    """Compute per-pitcher conditional pitch probabilities by count and batter hand."""
    columns = [
        "player_id", "season", "batter_hand", "balls", "strikes",
        "pitch_type", "usage_pct", "sample_size", "zone_distribution",
    ]

    if statcast_df is None or statcast_df.empty:
        return pd.DataFrame(columns=columns)

    df = statcast_df.copy()
    df = df[df["pitch_type"].notna() & (df["pitch_type"] != "")]
    if df.empty:
        return pd.DataFrame(columns=columns)

    # Vectorized zone assignment
    df["zone_id"] = _vectorized_zone(df["plate_x"], df["plate_z"])

    # Aggregation keys
    keys = ["pitcher", "stand", "balls", "strikes", "pitch_type"]
    state_keys = ["pitcher", "stand", "balls", "strikes"]

    # Count pitches per group and per state
    group_counts = df.groupby(keys).size().reset_index(name="n_pitches")
    state_counts = df.groupby(state_keys).size().reset_index(name="state_total")

    merged = group_counts.merge(state_counts, on=state_keys, how="left")
    merged["usage_pct"] = np.round(merged["n_pitches"] / merged["state_total"] * 100, 1)

    # Build zone distributions per group
    zone_dists = (
        df.groupby(keys)["zone_id"]
        .apply(_zone_dist_json)
        .reset_index(name="zone_distribution")
    )

    result = merged.merge(zone_dists, on=keys, how="left")
    result = result.rename(columns={
        "pitcher": "player_id",
        "stand": "batter_hand",
        "n_pitches": "sample_size",
    })
    result["season"] = season
    result["player_id"] = result["player_id"].astype(int)
    result["balls"] = result["balls"].astype(int)
    result["strikes"] = result["strikes"].astype(int)
    result = result[columns]

    logger.info("Next pitch tendencies: %d combos for season %d", len(result), season)
    return result
