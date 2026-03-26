"""Transform Statcast data into pitcher tendency profiles."""

import json
import logging

import pandas as pd

from pipeline.transform.zones import assign_zone

logger = logging.getLogger(__name__)


def transform_pitcher_tendencies(
    statcast_df: pd.DataFrame,
    season: int,
) -> pd.DataFrame:
    """Compute per-pitcher, per-pitch-type, per-batter-hand tendency stats.

    For each pitcher / pitch_type / batter_hand combination:
      - usage_pct (within that hand matchup)
      - avg_velocity, avg_h_break, avg_v_break
      - zone_distribution: JSON dict of {zone_id: frequency_pct}

    Parameters
    ----------
    statcast_df : pd.DataFrame
        Raw Statcast pitch-level data.
    season : int
        Season year for the output records.

    Returns
    -------
    pd.DataFrame
        Columns matching the pitcher_tendencies schema.
    """
    columns = [
        "player_id", "season", "pitch_type", "batter_hand",
        "usage_pct", "avg_velocity", "avg_h_break", "avg_v_break",
        "zone_distribution",
    ]

    if statcast_df is None or statcast_df.empty:
        return pd.DataFrame(columns=columns)

    df = statcast_df.copy()

    # Drop rows without a pitch type
    df = df[df["pitch_type"].notna() & (df["pitch_type"] != "")]
    if df.empty:
        return pd.DataFrame(columns=columns)

    # Assign zones for distribution computation
    df["zone_id"] = df.apply(
        lambda r: assign_zone(r.get("plate_x"), r.get("plate_z")), axis=1
    )

    # Group by pitcher and batter hand to compute totals per matchup (for usage_pct)
    matchup_totals = (
        df.groupby(["pitcher", "stand"])
        .size()
        .reset_index(name="matchup_total")
    )

    # Group by pitcher, pitch_type, batter hand
    grouped = df.groupby(["pitcher", "pitch_type", "stand"])

    records = []
    for (pitcher_id, pitch_type, batter_hand), group in grouped:
        n_pitches = len(group)

        # Usage percentage within this pitcher+hand matchup
        matchup_row = matchup_totals[
            (matchup_totals["pitcher"] == pitcher_id)
            & (matchup_totals["stand"] == batter_hand)
        ]
        matchup_total = int(matchup_row["matchup_total"].iloc[0]) if not matchup_row.empty else n_pitches
        usage_pct = round(n_pitches / matchup_total * 100, 1) if matchup_total > 0 else 0.0

        # Average velocity, horizontal break, vertical break
        avg_velocity = group["release_speed"].mean()
        avg_h_break = group["pfx_x"].mean()
        avg_v_break = group["pfx_z"].mean()

        # Zone distribution: only count pitches that land in a zone
        zone_pitches = group[group["zone_id"] > 0]
        zone_dist = {}
        if not zone_pitches.empty:
            zone_counts = zone_pitches["zone_id"].value_counts()
            total_in_zone = zone_counts.sum()
            for z_id, count in zone_counts.items():
                zone_dist[str(int(z_id))] = round(count / total_in_zone * 100, 1)

        records.append(
            {
                "player_id": int(pitcher_id),
                "season": season,
                "pitch_type": pitch_type,
                "batter_hand": batter_hand,
                "usage_pct": usage_pct,
                "avg_velocity": round(float(avg_velocity), 1) if pd.notna(avg_velocity) else None,
                "avg_h_break": round(float(avg_h_break), 2) if pd.notna(avg_h_break) else None,
                "avg_v_break": round(float(avg_v_break), 2) if pd.notna(avg_v_break) else None,
                "zone_distribution": json.dumps(zone_dist),
            }
        )

    result = pd.DataFrame(records)
    logger.info(
        "Pitcher tendencies: %d combos for season %d",
        len(result),
        season,
    )
    return result
