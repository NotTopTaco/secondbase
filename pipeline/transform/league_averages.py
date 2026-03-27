"""Transform Statcast data into league-average pitch movement baselines."""

import logging

import pandas as pd

logger = logging.getLogger(__name__)


def transform_league_averages(
    statcast_df: pd.DataFrame,
    season: int,
) -> pd.DataFrame:
    """Compute league-average pitch characteristics by type and pitcher hand.

    For each pitch_type / pitcher_hand:
      - avg_velocity, avg_h_break, avg_v_break, sample_size
    """
    columns = [
        "season", "pitch_type", "pitcher_hand",
        "avg_velocity", "avg_h_break", "avg_v_break", "sample_size",
    ]

    if statcast_df is None or statcast_df.empty:
        return pd.DataFrame(columns=columns)

    df = statcast_df.copy()
    df = df[df["pitch_type"].notna() & (df["pitch_type"] != "")]
    if df.empty:
        return pd.DataFrame(columns=columns)

    grouped = df.groupby(["pitch_type", "p_throws"])

    records = []
    for (pitch_type, pitcher_hand), group in grouped:
        n = len(group)
        if n < 10:
            continue

        avg_velocity = group["release_speed"].mean()
        avg_h_break = group["pfx_x"].mean()
        avg_v_break = group["pfx_z"].mean()

        records.append({
            "season": season,
            "pitch_type": pitch_type,
            "pitcher_hand": pitcher_hand,
            "avg_velocity": round(float(avg_velocity), 1) if pd.notna(avg_velocity) else None,
            "avg_h_break": round(float(avg_h_break), 2) if pd.notna(avg_h_break) else None,
            "avg_v_break": round(float(avg_v_break), 2) if pd.notna(avg_v_break) else None,
            "sample_size": n,
        })

    result = pd.DataFrame(records)
    logger.info("League averages: %d pitch type combos for season %d", len(result), season)
    return result
