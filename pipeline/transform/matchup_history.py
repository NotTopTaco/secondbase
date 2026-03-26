"""Transform Statcast data into batter-vs-pitcher matchup at-bat logs."""

import json
import logging

import pandas as pd

logger = logging.getLogger(__name__)


def transform_matchup_history(
    statcast_df: pd.DataFrame,
    season: int,
) -> pd.DataFrame:
    """Build a matchup at-bat log from Statcast pitch-level data.

    Groups by batter/pitcher/game/at_bat to collect each at-bat's pitch
    sequence and final result.

    Parameters
    ----------
    statcast_df : pd.DataFrame
        Raw Statcast pitch-level data.
    season : int
        Season year (used for reference; game_date is the actual date).

    Returns
    -------
    pd.DataFrame
        Columns matching the matchup_history schema:
        batter_id, pitcher_id, game_pk, game_date, at_bat_number,
        pitch_sequence, result, exit_velo, launch_angle
    """
    columns = [
        "batter_id", "pitcher_id", "game_pk", "game_date",
        "at_bat_number", "pitch_sequence", "result",
        "exit_velo", "launch_angle",
    ]

    if statcast_df is None or statcast_df.empty:
        return pd.DataFrame(columns=columns)

    df = statcast_df.copy()

    # Ensure required columns exist
    required = ["batter", "pitcher", "game_pk", "at_bat_number"]
    for col in required:
        if col not in df.columns:
            return pd.DataFrame(columns=columns)

    # Sort by game and pitch number so sequences are in order
    sort_cols = ["game_pk", "at_bat_number"]
    if "pitch_number" in df.columns:
        sort_cols.append("pitch_number")
    df = df.sort_values(sort_cols)

    # Group by batter/pitcher/game/at-bat
    grouped = df.groupby(["batter", "pitcher", "game_pk", "at_bat_number"])

    records = []
    for (batter_id, pitcher_id, game_pk, ab_num), group in grouped:
        # Build pitch sequence as JSON array
        pitch_seq = []
        for _, pitch in group.iterrows():
            pitch_entry = {
                "pitch_type": pitch.get("pitch_type") if pd.notna(pitch.get("pitch_type")) else None,
                "speed": round(float(pitch["release_speed"]), 1) if pd.notna(pitch.get("release_speed")) else None,
                "result": pitch.get("description") if pd.notna(pitch.get("description")) else None,
            }
            pitch_seq.append(pitch_entry)

        # The final event of the at-bat
        last_row = group.iloc[-1]
        result = last_row.get("events") if pd.notna(last_row.get("events")) else None
        game_date = str(last_row.get("game_date", "")) if pd.notna(last_row.get("game_date")) else None

        exit_velo = None
        if pd.notna(last_row.get("launch_speed")):
            exit_velo = round(float(last_row["launch_speed"]), 1)

        launch_angle = None
        if pd.notna(last_row.get("launch_angle")):
            launch_angle = round(float(last_row["launch_angle"]), 1)

        records.append(
            {
                "batter_id": int(batter_id),
                "pitcher_id": int(pitcher_id),
                "game_pk": int(game_pk),
                "game_date": game_date,
                "at_bat_number": int(ab_num),
                "pitch_sequence": json.dumps(pitch_seq),
                "result": result,
                "exit_velo": exit_velo,
                "launch_angle": launch_angle,
            }
        )

    result_df = pd.DataFrame(records)
    logger.info(
        "Matchup history: %d at-bats for season %d",
        len(result_df),
        season,
    )
    return result_df
