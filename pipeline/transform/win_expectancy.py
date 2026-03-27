"""Transform Statcast play-level data into win expectancy lookup table."""

import logging

import pandas as pd

from pipeline.transform.woba import PA_ENDING_EVENTS

logger = logging.getLogger(__name__)


def _runner_state(on_1b, on_2b, on_3b) -> str:
    """Encode runner state as a 3-char string like '101' (1st and 3rd)."""
    return (
        ("1" if pd.notna(on_1b) else "0")
        + ("1" if pd.notna(on_2b) else "0")
        + ("1" if pd.notna(on_3b) else "0")
    )


def transform_win_expectancy(
    statcast_df: pd.DataFrame,
    season: int,
) -> pd.DataFrame:
    """Compute empirical win expectancy by game state from Statcast data.

    Groups completed games by (inning, half, outs, runner_state, score_diff)
    and computes the fraction of times the home team won.
    """
    columns = ["inning", "half", "outs", "runner_state", "score_diff", "home_wp"]

    if statcast_df is None or statcast_df.empty:
        return pd.DataFrame(columns=columns)

    df = statcast_df.copy()

    # Need game-level outcomes: determine who won each game
    # Use bat_score and fld_score at the end of each game
    df = df[df["events"].notna() & df["events"].isin(PA_ENDING_EVENTS)]
    if df.empty:
        return pd.DataFrame(columns=columns)

    # Determine final scores per game
    game_finals = (
        df.sort_values(["game_pk", "at_bat_number"])
        .groupby("game_pk")
        .last()
        .reset_index()
    )

    # home_score and away_score: when inning_topbot is 'Bot', bat_score is home
    home_wins = {}
    for _, row in game_finals.iterrows():
        gpk = row["game_pk"]
        if row.get("inning_topbot") == "Bot":
            home_score = row.get("bat_score", 0)
            away_score = row.get("fld_score", 0)
        else:
            home_score = row.get("fld_score", 0)
            away_score = row.get("bat_score", 0)
        home_wins[gpk] = 1 if home_score > away_score else 0

    # Filter to only completed games where we know the winner
    valid_games = set(home_wins.keys())
    df = df[df["game_pk"].isin(valid_games)]

    # Map each PA to its game state
    df["runner_state"] = df.apply(
        lambda r: _runner_state(r.get("on_1b"), r.get("on_2b"), r.get("on_3b")),
        axis=1,
    )
    df["half"] = df["inning_topbot"].map({"Top": "top", "Bot": "bottom"})
    df = df[df["half"].notna()]

    # Score diff from home perspective
    df["score_diff"] = df.apply(
        lambda r: (
            int(r.get("bat_score", 0)) - int(r.get("fld_score", 0))
            if r.get("inning_topbot") == "Bot"
            else int(r.get("fld_score", 0)) - int(r.get("bat_score", 0))
        ),
        axis=1,
    )
    # Clamp score_diff to [-10, 10]
    df["score_diff"] = df["score_diff"].clip(-10, 10)
    # Clamp innings to [1, 12]
    df["inning"] = df["inning"].clip(upper=12)

    df["home_won"] = df["game_pk"].map(home_wins)

    grouped = df.groupby(["inning", "half", "outs_when_up", "runner_state", "score_diff"])

    records = []
    for (inning, half, outs, runner_state, score_diff), group in grouped:
        home_wp = group["home_won"].mean()
        records.append({
            "inning": int(inning),
            "half": half,
            "outs": int(outs),
            "runner_state": runner_state,
            "score_diff": int(score_diff),
            "home_wp": round(float(home_wp), 4),
        })

    result = pd.DataFrame(records)
    logger.info("Win expectancy: %d states for season %d", len(result), season)
    return result
