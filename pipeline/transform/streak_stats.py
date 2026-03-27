"""Transform Statcast data into per-game batter and pitcher stats for streak tracking."""

import logging

import numpy as np
import pandas as pd

from pipeline.transform.woba import HIT_EVENTS, NON_AB_EVENTS, PA_ENDING_EVENTS

logger = logging.getLogger(__name__)


def transform_streak_stats(
    statcast_df: pd.DataFrame,
    season: int,
) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Return (batter_game_stats_df, pitcher_game_stats_df)."""
    logger.info("Transforming streak stats for season %d", season)

    if statcast_df is None or statcast_df.empty:
        logger.warning("Empty statcast DataFrame, returning empty streak stats")
        return pd.DataFrame(), pd.DataFrame()

    # Filter to PA-ending events
    pa_df = statcast_df[statcast_df["events"].isin(PA_ENDING_EVENTS)].copy()

    if pa_df.empty:
        logger.warning("No PA-ending events found")
        return pd.DataFrame(), pd.DataFrame()

    # Pre-compute boolean columns used by both batter and pitcher aggregations
    pa_df["is_hit"] = pa_df["events"].isin(HIT_EVENTS)
    pa_df["is_non_ab"] = pa_df["events"].isin(NON_AB_EVENTS)
    pa_df["base_value"] = pa_df["events"].map(HIT_EVENTS).fillna(0).astype(int)
    pa_df["is_bb"] = pa_df["events"].isin({"walk", "intent_walk"})
    pa_df["is_k"] = pa_df["events"].str.contains("strikeout", na=False)
    pa_df["is_hr"] = pa_df["events"] == "home_run"

    batter_df = _transform_batter_game_stats(pa_df, season)
    pitcher_df = _transform_pitcher_game_stats(pa_df, season)

    return batter_df, pitcher_df


def _transform_batter_game_stats(pa_df: pd.DataFrame, season: int) -> pd.DataFrame:
    """One row per (batter, game_date) with counting stats."""
    grouped = pa_df.groupby(["batter", "game_date"])

    rows = []
    for (batter_id, game_date), g in grouped:
        pa = len(g)
        ab = pa - g["is_non_ab"].sum()
        h = g["is_hit"].sum()
        total_bases = g["base_value"].sum()
        bb = g["is_bb"].sum()
        k = g["is_k"].sum()

        woba_vals = g["woba_value"].dropna()
        woba_denoms = g["woba_denom"].dropna()
        woba_value_sum = float(woba_vals.sum()) if not woba_vals.empty else 0.0
        woba_denom_sum = float(woba_denoms.sum()) if not woba_denoms.empty else 0.0

        ev = g["launch_speed"].dropna()
        avg_exit_velo = float(ev.mean()) if not ev.empty else None

        # Use the first game_pk for the date (handles doubleheaders by merging)
        game_pk = int(g["game_pk"].iloc[0]) if "game_pk" in g.columns and not g["game_pk"].isna().all() else None

        rows.append({
            "player_id": int(batter_id),
            "season": season,
            "game_date": str(game_date),
            "game_pk": game_pk,
            "pa": int(pa),
            "ab": int(ab),
            "h": int(h),
            "total_bases": int(total_bases),
            "bb": int(bb),
            "k": int(k),
            "woba_value_sum": woba_value_sum,
            "woba_denom_sum": woba_denom_sum,
            "avg_exit_velo": avg_exit_velo,
        })

    df = pd.DataFrame(rows)
    logger.info("Batter game stats: %d rows for %d players", len(df), df["player_id"].nunique() if not df.empty else 0)
    return df


def _transform_pitcher_game_stats(pa_df: pd.DataFrame, season: int) -> pd.DataFrame:
    """One row per (pitcher, game_date) with counting stats and game score."""
    grouped = pa_df.groupby(["pitcher", "game_date"])

    rows = []
    for (pitcher_id, game_date), g in grouped:
        pa_against = len(g)
        ab_against = pa_against - g["is_non_ab"].sum()
        h_against = g["is_hit"].sum()
        hr_against = g["is_hr"].sum()
        bb_against = g["is_bb"].sum()
        k = g["is_k"].sum()

        # Outs recorded: at-bats minus hits, plus sac plays
        # This is an approximation: PA - H - BB - HBP - errors ≈ outs
        sac_events = {"sac_fly", "sac_bunt", "sac_fly_double_play", "sac_bunt_double_play"}
        error_events = {"field_error"}
        outs_from_ab = ab_against - h_against
        sac_outs = g["events"].isin(sac_events).sum()
        # double plays count as 2 outs
        dp_events = {"grounded_into_double_play", "double_play", "strikeout_double_play", "sac_fly_double_play", "sac_bunt_double_play"}
        dp_extra = g["events"].isin(dp_events).sum()
        tp_extra = (g["events"] == "triple_play").sum() * 2
        outs_recorded = int(outs_from_ab + sac_outs + dp_extra + tp_extra)

        # Simplified Game Score: 50 + outs + 2*K - 2*H - 4*HR - 2*BB
        game_score = int(50 + outs_recorded + 2 * k - 2 * h_against - 4 * hr_against - 2 * bb_against)

        game_pk = int(g["game_pk"].iloc[0]) if "game_pk" in g.columns and not g["game_pk"].isna().all() else None

        rows.append({
            "player_id": int(pitcher_id),
            "season": season,
            "game_date": str(game_date),
            "game_pk": game_pk,
            "pa_against": int(pa_against),
            "ab_against": int(ab_against),
            "h_against": int(h_against),
            "hr_against": int(hr_against),
            "bb_against": int(bb_against),
            "k": int(k),
            "outs_recorded": outs_recorded,
            "game_score": game_score,
        })

    df = pd.DataFrame(rows)
    logger.info("Pitcher game stats: %d rows for %d players", len(df), df["player_id"].nunique() if not df.empty else 0)
    return df
