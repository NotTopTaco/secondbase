"""Transform Statcast data into batter-vs-pitch-type performance stats."""

import logging

import pandas as pd

from pipeline.transform.woba import (
    PA_ENDING_EVENTS,
    compute_ba,
    compute_slg,
    compute_woba,
    compute_whiff_pct,
)

logger = logging.getLogger(__name__)


def transform_batter_vs_pitch(
    statcast_df: pd.DataFrame,
    season: int,
) -> pd.DataFrame:
    """Compute per-batter, per-pitch-type, per-pitcher-hand stats.

    For each combination: PA, BA, SLG, wOBA, whiff_pct, avg_exit_velo,
    avg_launch_angle.

    Parameters
    ----------
    statcast_df : pd.DataFrame
        Raw Statcast pitch-level data.
    season : int
        Season year for the output records.

    Returns
    -------
    pd.DataFrame
        Columns matching the batter_vs_pitch_type schema.
    """
    columns = [
        "player_id", "season", "pitch_type", "pitcher_hand",
        "pa", "ba", "slg", "woba", "whiff_pct",
        "avg_exit_velo", "avg_launch_angle",
    ]

    if statcast_df is None or statcast_df.empty:
        return pd.DataFrame(columns=columns)

    df = statcast_df.copy()

    # Drop rows without a pitch type
    df = df[df["pitch_type"].notna() & (df["pitch_type"] != "")]
    if df.empty:
        return pd.DataFrame(columns=columns)

    grouped = df.groupby(["batter", "pitch_type", "p_throws"])

    records = []
    for (batter_id, pitch_type, pitcher_hand), group in grouped:
        # Count plate appearances (only rows with PA-ending events)
        pa_count = 0
        if "events" in group.columns:
            pa_events = group["events"].dropna()
            pa_count = int(pa_events.isin(PA_ENDING_EVENTS).sum())

        ba = compute_ba(group)
        slg = compute_slg(group)
        woba = compute_woba(group)
        whiff_pct = compute_whiff_pct(group)

        # Average exit velocity and launch angle (only on batted balls)
        avg_exit_velo = None
        avg_launch_angle = None
        if "launch_speed" in group.columns:
            ev = group["launch_speed"].dropna()
            if not ev.empty:
                avg_exit_velo = round(float(ev.mean()), 1)
        if "launch_angle" in group.columns:
            la = group["launch_angle"].dropna()
            if not la.empty:
                avg_launch_angle = round(float(la.mean()), 1)

        records.append(
            {
                "player_id": int(batter_id),
                "season": season,
                "pitch_type": pitch_type,
                "pitcher_hand": pitcher_hand,
                "pa": pa_count,
                "ba": round(ba, 3) if ba is not None else None,
                "slg": round(slg, 3) if slg is not None else None,
                "woba": round(woba, 3) if woba is not None else None,
                "whiff_pct": round(whiff_pct, 3) if whiff_pct is not None else None,
                "avg_exit_velo": avg_exit_velo,
                "avg_launch_angle": avg_launch_angle,
            }
        )

    result = pd.DataFrame(records)
    logger.info(
        "Batter vs pitch: %d combos for season %d",
        len(result),
        season,
    )
    return result
