"""Schema validation for pipeline DataFrames before loading into SQLite."""

import logging

import pandas as pd

logger = logging.getLogger(__name__)

# Schema registry: maps table name -> expected columns and primary key columns.
# Columns lists match the DB schema; PK columns must be non-null.
TABLE_SCHEMAS: dict[str, dict] = {
    "players": {
        "columns": [
            "player_id", "full_name", "team", "position",
            "bats", "throws", "headshot_url",
        ],
        "pk_columns": ["player_id"],
    },
    "batter_hot_zones": {
        "columns": [
            "player_id", "season", "period", "zone_id",
            "woba", "ba", "slg", "sample_size",
        ],
        "pk_columns": ["player_id", "season", "period", "zone_id"],
    },
    "pitcher_tendencies": {
        "columns": [
            "player_id", "season", "pitch_type", "batter_hand",
            "usage_pct", "avg_velocity", "avg_h_break", "avg_v_break",
            "zone_distribution",
        ],
        "pk_columns": ["player_id", "season", "pitch_type", "batter_hand"],
    },
    "batter_vs_pitch_type": {
        "columns": [
            "player_id", "season", "pitch_type", "pitcher_hand",
            "pa", "ba", "slg", "woba", "whiff_pct",
            "avg_exit_velo", "avg_launch_angle",
        ],
        "pk_columns": ["player_id", "season", "pitch_type", "pitcher_hand"],
    },
    "batter_spray_chart": {
        "columns": [
            "player_id", "season", "game_pk", "at_bat_number",
            "hc_x", "hc_y", "exit_velo", "launch_angle",
            "result", "pitch_type", "pitcher_hand", "game_date",
        ],
        "pk_columns": ["player_id"],
    },
    "matchup_history": {
        "columns": [
            "batter_id", "pitcher_id", "game_pk", "game_date",
            "at_bat_number", "pitch_sequence", "result",
            "exit_velo", "launch_angle",
        ],
        "pk_columns": ["batter_id", "pitcher_id"],
    },
    "pitcher_count_tendencies": {
        "columns": [
            "player_id", "season", "batter_hand", "balls", "strikes",
            "pitch_type", "usage_pct", "sample_size", "zone_distribution",
        ],
        "pk_columns": [
            "player_id", "season", "batter_hand", "balls", "strikes",
            "pitch_type",
        ],
    },
    "win_expectancy": {
        "columns": [
            "inning", "half", "outs", "runner_state",
            "score_diff", "home_wp",
        ],
        "pk_columns": [
            "inning", "half", "outs", "runner_state", "score_diff",
        ],
    },
    "pitcher_tto_splits": {
        "columns": [
            "player_id", "season", "times_through",
            "pa", "ba", "slg", "woba", "k_pct", "bb_pct",
            "avg_exit_velo",
        ],
        "pk_columns": ["player_id", "season", "times_through"],
    },
    "umpires": {
        "columns": ["umpire_id", "umpire_name"],
        "pk_columns": ["umpire_id"],
    },
    "umpire_zones": {
        "columns": [
            "umpire_id", "season", "zone_id",
            "called_strike_pct", "sample_size",
        ],
        "pk_columns": ["umpire_id", "season", "zone_id"],
    },
    "umpire_stats": {
        "columns": [
            "umpire_id", "season", "games", "accuracy_pct",
            "expanded_zone_rate", "consistency_rating",
        ],
        "pk_columns": ["umpire_id", "season"],
    },
    "league_pitch_averages": {
        "columns": [
            "season", "pitch_type", "pitcher_hand",
            "avg_velocity", "avg_h_break", "avg_v_break", "sample_size",
        ],
        "pk_columns": ["season", "pitch_type", "pitcher_hand"],
    },
    "batter_count_stats": {
        "columns": [
            "player_id", "season", "balls", "strikes",
            "pa", "ba", "slg", "woba", "k_pct", "bb_pct",
        ],
        "pk_columns": ["player_id", "season", "balls", "strikes"],
    },
    "batter_game_stats": {
        "columns": [
            "player_id", "season", "game_date", "game_pk",
            "pa", "ab", "h", "total_bases", "bb", "k",
            "woba_value_sum", "woba_denom_sum", "avg_exit_velo",
        ],
        "pk_columns": ["player_id", "season", "game_pk"],
    },
    "pitcher_game_stats": {
        "columns": [
            "player_id", "season", "game_date", "game_pk",
            "pa_against", "ab_against", "h_against", "hr_against",
            "bb_against", "k", "outs_recorded", "game_score",
        ],
        "pk_columns": ["player_id", "season", "game_pk"],
    },
    "batter_defensive_alignment": {
        "columns": [
            "player_id", "season",
            "if_standard_pct", "if_shade_pct", "if_strategic_pct",
            "of_standard_pct", "of_strategic_pct",
            "total_pa", "pull_pct", "center_pct", "oppo_pct",
        ],
        "pk_columns": ["player_id", "season"],
    },
    "pitch_tunneling": {
        "columns": [
            "player_id", "season", "pitch_type_a", "pitch_type_b",
            "tunnel_score", "decision_point_distance_ft",
            "separation_at_decision_in", "separation_at_plate_in",
            "release_x_a", "release_z_a", "release_x_b", "release_z_b",
            "velocity_a", "velocity_b",
            "pfx_x_a", "pfx_z_a", "pfx_x_b", "pfx_z_b",
            "plate_x_a", "plate_z_a", "plate_x_b", "plate_z_b",
            "extension_a", "extension_b",
            "sample_a", "sample_b",
        ],
        "pk_columns": ["player_id", "season", "pitch_type_a", "pitch_type_b"],
    },
}


def validate_before_load(
    table_name: str,
    df: pd.DataFrame,
) -> tuple[list[str], pd.DataFrame]:
    """Validate a DataFrame against the expected schema before loading.

    Returns (warnings, cleaned_df) where cleaned_df has null-PK rows removed.
    """
    warnings: list[str] = []

    if table_name not in TABLE_SCHEMAS:
        return warnings, df

    schema = TABLE_SCHEMAS[table_name]
    expected_cols = set(schema["columns"])
    actual_cols = set(df.columns)

    missing = expected_cols - actual_cols
    extra = actual_cols - expected_cols

    if missing:
        warnings.append(f"missing columns: {sorted(missing)}")
    if extra:
        warnings.append(f"unexpected columns: {sorted(extra)}")

    # Drop rows with null primary key values
    pk_cols = schema["pk_columns"]
    pk_present = [c for c in pk_cols if c in df.columns]
    if pk_present:
        null_pk = df[pk_present].isnull().any(axis=1)
        n_bad = int(null_pk.sum())
        if n_bad > 0:
            warnings.append(f"dropping {n_bad} rows with null PK columns")
            df = df[~null_pk]

    return warnings, df
