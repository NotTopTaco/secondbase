"""Helper functions for computing batting stats from Statcast data."""

import numpy as np
import pandas as pd

# Events that count as hits, with total-base values
HIT_EVENTS = {
    "single": 1,
    "double": 2,
    "triple": 3,
    "home_run": 4,
}

# Events that remove a PA from at-bat denominator
NON_AB_EVENTS = {
    "walk",
    "hit_by_pitch",
    "sac_fly",
    "sac_bunt",
    "sac_fly_double_play",
    "sac_bunt_double_play",
    "intent_walk",
    "catcher_interf",
}

# All events that end a plate appearance
PA_ENDING_EVENTS = {
    "single",
    "double",
    "triple",
    "home_run",
    "strikeout",
    "field_out",
    "grounded_into_double_play",
    "force_out",
    "fielders_choice",
    "fielders_choice_out",
    "double_play",
    "field_error",
    "walk",
    "hit_by_pitch",
    "sac_fly",
    "sac_bunt",
    "sac_fly_double_play",
    "sac_bunt_double_play",
    "intent_walk",
    "strikeout_double_play",
    "triple_play",
    "catcher_interf",
}


def classify_hit(event: str) -> str | None:
    """Return the hit type if event is a hit, else None."""
    if event in HIT_EVENTS:
        return event
    return None


def _safe_divide(numerator: float, denominator: float) -> float | None:
    """Return numerator/denominator, or None if denominator is zero."""
    if denominator == 0:
        return None
    return numerator / denominator


def compute_ba(df: pd.DataFrame) -> float | None:
    """Compute batting average: hits / at_bats.

    At-bats = PA ending events minus non-AB events (walks, HBP, sac, etc.)
    """
    if df is None or df.empty:
        return None

    events = df["events"].dropna()
    if events.empty:
        return None

    pa_events = events[events.isin(PA_ENDING_EVENTS)]
    at_bats = pa_events[~pa_events.isin(NON_AB_EVENTS)]

    hits = at_bats[at_bats.isin(HIT_EVENTS)]
    return _safe_divide(len(hits), len(at_bats))


def compute_slg(df: pd.DataFrame) -> float | None:
    """Compute slugging percentage: total_bases / at_bats."""
    if df is None or df.empty:
        return None

    events = df["events"].dropna()
    if events.empty:
        return None

    pa_events = events[events.isin(PA_ENDING_EVENTS)]
    at_bats = pa_events[~pa_events.isin(NON_AB_EVENTS)]
    n_ab = len(at_bats)
    if n_ab == 0:
        return None

    total_bases = sum(
        HIT_EVENTS.get(e, 0) for e in at_bats
    )
    return total_bases / n_ab


def compute_woba(df: pd.DataFrame) -> float | None:
    """Compute wOBA using Statcast's woba_value and woba_denom columns."""
    if df is None or df.empty:
        return None

    if "woba_value" not in df.columns or "woba_denom" not in df.columns:
        return None

    total_value = df["woba_value"].sum()
    total_denom = df["woba_denom"].sum()

    if pd.isna(total_denom) or total_denom == 0:
        return None

    result = total_value / total_denom
    if pd.isna(result):
        return None
    return float(result)


def compute_whiff_pct(df: pd.DataFrame) -> float | None:
    """Compute whiff percentage: swinging_strikes / swings.

    Swings include: swinging_strike, swinging_strike_blocked, foul, foul_tip,
                    hit_into_play, foul_bunt, missed_bunt, hit_into_play_score,
                    hit_into_play_no_out
    Swinging strikes: swinging_strike, swinging_strike_blocked
    """
    if df is None or df.empty:
        return None

    if "description" not in df.columns:
        return None

    swing_descriptions = {
        "swinging_strike",
        "swinging_strike_blocked",
        "foul",
        "foul_tip",
        "hit_into_play",
        "hit_into_play_score",
        "hit_into_play_no_out",
        "foul_bunt",
        "missed_bunt",
        "bunt_foul_tip",
    }
    whiff_descriptions = {
        "swinging_strike",
        "swinging_strike_blocked",
    }

    desc = df["description"].dropna()
    swings = desc[desc.isin(swing_descriptions)]
    whiffs = desc[desc.isin(whiff_descriptions)]

    return _safe_divide(len(whiffs), len(swings))
