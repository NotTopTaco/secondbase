"""Transform Statcast data into batter performance by count."""

import logging

import pandas as pd

from pipeline.transform.woba import (
    PA_ENDING_EVENTS,
    NON_AB_EVENTS,
    HIT_EVENTS,
    compute_woba,
)

logger = logging.getLogger(__name__)


def transform_batter_count_stats(
    statcast_df: pd.DataFrame,
    season: int,
) -> pd.DataFrame:
    """Compute batter performance by count state.

    For each batter / count (balls, strikes):
      - pa, ba, slg, woba, k_pct, bb_pct
    """
    columns = [
        "player_id", "season", "balls", "strikes",
        "pa", "ba", "slg", "woba", "k_pct", "bb_pct",
    ]

    if statcast_df is None or statcast_df.empty:
        return pd.DataFrame(columns=columns)

    df = statcast_df.copy()
    # Only PA-ending events
    df = df[df["events"].notna() & df["events"].isin(PA_ENDING_EVENTS)]
    if df.empty:
        return pd.DataFrame(columns=columns)

    records = []
    for (batter_id, balls, strikes), group in df.groupby(["batter", "balls", "strikes"]):
        pa = len(group)
        if pa < 3:
            continue

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

        records.append({
            "player_id": int(batter_id),
            "season": season,
            "balls": int(balls),
            "strikes": int(strikes),
            "pa": pa,
            "ba": ba,
            "slg": slg,
            "woba": woba,
            "k_pct": k_pct,
            "bb_pct": bb_pct,
        })

    result = pd.DataFrame(records)
    logger.info("Batter count stats: %d rows for season %d", len(result), season)
    return result
