"""Transform raw MLB API player data to match the players table schema."""

import pandas as pd


def transform_players(player_df: pd.DataFrame) -> pd.DataFrame:
    """Take raw MLB API player data and return a DataFrame matching the players table.

    Expected input columns: player_id, full_name, team, position, bats, throws, headshot_url
    Output columns: player_id, full_name, team, position, bats, throws, headshot_url
    """
    if player_df is None or player_df.empty:
        return pd.DataFrame(
            columns=[
                "player_id",
                "full_name",
                "team",
                "position",
                "bats",
                "throws",
                "headshot_url",
            ]
        )

    target_columns = [
        "player_id",
        "full_name",
        "team",
        "position",
        "bats",
        "throws",
        "headshot_url",
    ]

    # Keep only the columns we need (they should already be present from mlb_api.py)
    available = [c for c in target_columns if c in player_df.columns]
    df = player_df[available].copy()

    # Ensure player_id is integer
    df["player_id"] = df["player_id"].astype(int)

    # Drop duplicates on player_id, keeping last
    df = df.drop_duplicates(subset="player_id", keep="last")

    return df.reset_index(drop=True)
