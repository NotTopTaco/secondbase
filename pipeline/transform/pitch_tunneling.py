"""Transform Statcast data into pitch tunneling pair analysis per pitcher."""

import logging
import math
from itertools import combinations

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

# Constants
RUBBER_Y = 60.5  # feet from plate to pitcher's rubber
PLATE_Y = 17 / 12  # front of plate in feet (1.417 ft)
DECISION_TIME = 0.175  # seconds before plate for batter's decision
MIN_SAMPLES = 20  # minimum pitches per pitch type to include


def _trajectory_at_fraction(
    x0: float, z0: float,
    plate_x: float, plate_z: float,
    pfx_x_in: float, pfx_z_in: float,
    frac: float,
) -> tuple[float, float]:
    """Compute (x, z) position at fraction t through the pitch flight."""
    pfx_x_ft = pfx_x_in / 12.0
    pfx_z_ft = pfx_z_in / 12.0

    x_lin = x0 + (plate_x - x0 - pfx_x_ft) * frac
    z_lin = z0 + (plate_z - z0 - pfx_z_ft) * frac

    x = x_lin + pfx_x_ft * frac * frac
    z = z_lin + pfx_z_ft * frac * frac

    return x, z


def _compute_decision_fraction(velocity_mph: float, extension_ft: float) -> float:
    """Fraction of pitch flight at which the batter must decide."""
    y0 = RUBBER_Y - extension_ft
    y_distance = y0 - PLATE_Y
    v_fps = velocity_mph * 1.467
    if v_fps <= 0:
        return 0.5
    t_total = y_distance / v_fps
    if t_total <= 0:
        return 0.5
    return max(0.0, min(1.0, 1.0 - DECISION_TIME / t_total))


def _compute_tunnel_pair(a: dict, b: dict) -> dict | None:
    """Compute tunnel metrics for a pair of pitch types."""
    # Decision fraction based on slower pitch (longer flight time -> later decision)
    frac_a = _compute_decision_fraction(a["avg_velocity"], a["avg_extension"])
    frac_b = _compute_decision_fraction(b["avg_velocity"], b["avg_extension"])
    # Use the average decision fraction
    decision_frac = (frac_a + frac_b) / 2.0

    # Compute decision point distance from plate
    y0_a = RUBBER_Y - a["avg_extension"]
    y0_b = RUBBER_Y - b["avg_extension"]
    y_dist = ((y0_a + y0_b) / 2.0) - PLATE_Y
    decision_distance_ft = y_dist * (1.0 - decision_frac)

    # Positions at decision point
    xa, za = _trajectory_at_fraction(
        a["avg_release_x"], a["avg_release_z"],
        a["avg_plate_x"], a["avg_plate_z"],
        a["avg_pfx_x"], a["avg_pfx_z"],
        decision_frac,
    )
    xb, zb = _trajectory_at_fraction(
        b["avg_release_x"], b["avg_release_z"],
        b["avg_plate_x"], b["avg_plate_z"],
        b["avg_pfx_x"], b["avg_pfx_z"],
        decision_frac,
    )

    sep_decision_ft = math.sqrt((xa - xb) ** 2 + (za - zb) ** 2)
    sep_decision_in = sep_decision_ft * 12.0

    # Separation at the plate
    sep_plate_ft = math.sqrt(
        (a["avg_plate_x"] - b["avg_plate_x"]) ** 2
        + (a["avg_plate_z"] - b["avg_plate_z"]) ** 2
    )
    sep_plate_in = sep_plate_ft * 12.0

    # Filter: only include if pitches are somewhat close at decision
    if sep_decision_in > 6.0:
        return None

    # Tunnel score: how much they diverge from decision to plate
    tunnel_score = sep_plate_in / sep_decision_in if sep_decision_in > 0.1 else 0.0

    return {
        "tunnel_score": round(tunnel_score, 2),
        "decision_point_distance_ft": round(decision_distance_ft, 1),
        "separation_at_decision_in": round(sep_decision_in, 2),
        "separation_at_plate_in": round(sep_plate_in, 2),
    }


def transform_pitch_tunneling(
    statcast_df: pd.DataFrame,
    season: int,
) -> pd.DataFrame:
    """Compute pitch tunneling metrics for each pitcher's pitch-type pairs."""
    logger.info("Transforming pitch tunneling for season %d", season)

    if statcast_df is None or statcast_df.empty:
        logger.warning("Empty statcast DataFrame")
        return pd.DataFrame()

    # Required columns
    required = [
        "pitcher", "pitch_type", "release_speed",
        "release_pos_x", "release_pos_z", "release_extension",
        "pfx_x", "pfx_z", "plate_x", "plate_z",
    ]
    missing = [c for c in required if c not in statcast_df.columns]
    if missing:
        logger.warning("Missing columns for tunneling: %s", missing)
        return pd.DataFrame()

    # Filter to rows with all required data
    df = statcast_df.dropna(subset=required).copy()
    if df.empty:
        logger.warning("No rows with complete tunneling data")
        return pd.DataFrame()

    # Group by pitcher and pitch_type
    pitcher_pitch_groups = df.groupby(["pitcher", "pitch_type"])
    pitch_profiles: dict[int, dict[str, dict]] = {}

    for (pitcher_id, pitch_type), group in pitcher_pitch_groups:
        if len(group) < MIN_SAMPLES:
            continue

        pitcher_id = int(pitcher_id)
        if pitcher_id not in pitch_profiles:
            pitch_profiles[pitcher_id] = {}

        pitch_profiles[pitcher_id][pitch_type] = {
            "pitch_type": pitch_type,
            "avg_release_x": float(group["release_pos_x"].mean()),
            "avg_release_z": float(group["release_pos_z"].mean()),
            "avg_extension": float(group["release_extension"].mean()),
            "avg_velocity": float(group["release_speed"].mean()),
            "avg_pfx_x": float(group["pfx_x"].mean()),
            "avg_pfx_z": float(group["pfx_z"].mean()),
            "avg_plate_x": float(group["plate_x"].mean()),
            "avg_plate_z": float(group["plate_z"].mean()),
            "sample_size": len(group),
        }

    # Compute all pairs per pitcher
    rows = []
    for pitcher_id, profiles in pitch_profiles.items():
        pitch_types = sorted(profiles.keys())
        if len(pitch_types) < 2:
            continue

        for pt_a, pt_b in combinations(pitch_types, 2):
            a = profiles[pt_a]
            b = profiles[pt_b]

            metrics = _compute_tunnel_pair(a, b)
            if metrics is None:
                continue

            rows.append({
                "player_id": pitcher_id,
                "season": season,
                "pitch_type_a": pt_a,
                "pitch_type_b": pt_b,
                "tunnel_score": metrics["tunnel_score"],
                "decision_point_distance_ft": metrics["decision_point_distance_ft"],
                "separation_at_decision_in": metrics["separation_at_decision_in"],
                "separation_at_plate_in": metrics["separation_at_plate_in"],
                "release_x_a": a["avg_release_x"],
                "release_z_a": a["avg_release_z"],
                "release_x_b": b["avg_release_x"],
                "release_z_b": b["avg_release_z"],
                "velocity_a": a["avg_velocity"],
                "velocity_b": b["avg_velocity"],
                "pfx_x_a": a["avg_pfx_x"],
                "pfx_z_a": a["avg_pfx_z"],
                "pfx_x_b": b["avg_pfx_x"],
                "pfx_z_b": b["avg_pfx_z"],
                "plate_x_a": a["avg_plate_x"],
                "plate_z_a": a["avg_plate_z"],
                "plate_x_b": b["avg_plate_x"],
                "plate_z_b": b["avg_plate_z"],
                "extension_a": a["avg_extension"],
                "extension_b": b["avg_extension"],
                "sample_a": a["sample_size"],
                "sample_b": b["sample_size"],
            })

    result_df = pd.DataFrame(rows)
    logger.info("Pitch tunneling: %d pairs for %d pitchers", len(result_df), len(pitch_profiles))
    return result_df
