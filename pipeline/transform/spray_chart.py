"""Transform Statcast data into batter spray chart records."""

import logging

import pandas as pd

logger = logging.getLogger(__name__)

# Events that produce a batted ball with hit coordinates
_BATTED_BALL_EVENTS = {
    "single",
    "double",
    "triple",
    "home_run",
    "field_out",
    "grounded_into_double_play",
    "force_out",
    "fielders_choice",
    "fielders_choice_out",
    "double_play",
    "field_error",
    "sac_fly",
    "sac_fly_double_play",
    "triple_play",
    "sac_bunt",
    "sac_bunt_double_play",
}


def transform_spray_chart(
    statcast_df: pd.DataFrame,
    season: int,
) -> pd.DataFrame:
    """Extract batted-ball events with hit coordinates for spray charts.

    Parameters
    ----------
    statcast_df : pd.DataFrame
        Raw Statcast pitch-level data.
    season : int
        Season year for the output records.

    Returns
    -------
    pd.DataFrame
        Columns matching the batter_spray_chart schema:
        player_id, season, game_pk, at_bat_number, hc_x, hc_y,
        exit_velo, launch_angle, result, pitch_type, pitcher_hand, game_date
    """
    columns = [
        "player_id", "season", "game_pk", "at_bat_number",
        "hc_x", "hc_y", "exit_velo", "launch_angle",
        "result", "pitch_type", "pitcher_hand", "game_date",
    ]

    if statcast_df is None or statcast_df.empty:
        return pd.DataFrame(columns=columns)

    df = statcast_df.copy()

    # Filter to batted ball events with hit coordinates
    has_event = df["events"].isin(_BATTED_BALL_EVENTS)
    has_coords = df["hc_x"].notna() & df["hc_y"].notna()
    df = df[has_event & has_coords]

    if df.empty:
        return pd.DataFrame(columns=columns)

    result = pd.DataFrame(
        {
            "player_id": df["batter"].astype(int),
            "season": season,
            "game_pk": df["game_pk"],
            "at_bat_number": df["at_bat_number"],
            "hc_x": df["hc_x"],
            "hc_y": df["hc_y"],
            "exit_velo": df["launch_speed"],
            "launch_angle": df["launch_angle"],
            "result": df["events"],
            "pitch_type": df["pitch_type"],
            "pitcher_hand": df["p_throws"],
            "game_date": df["game_date"].astype(str),
        }
    ).reset_index(drop=True)

    # Drop duplicate batted ball events (same batter, game, at-bat)
    result = result.drop_duplicates(
        subset=["player_id", "game_pk", "at_bat_number"], keep="last"
    )

    logger.info(
        "Spray chart: %d batted ball events for season %d",
        len(result),
        season,
    )
    return result.reset_index(drop=True)
