"""Load transformed DataFrames into the SQLite database."""

import logging
import math
import sqlite3

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

# Table load order respects foreign key dependencies
_LOAD_ORDER = [
    "players",
    "batter_hot_zones",
    "pitcher_tendencies",
    "batter_vs_pitch_type",
    "batter_spray_chart",
    "matchup_history",
]


def _sanitize_value(v):
    """Convert pandas/numpy NA types to Python None for SQLite."""
    if v is None:
        return None
    if isinstance(v, float) and math.isnan(v):
        return None
    if isinstance(v, (np.integer,)):
        return int(v)
    if isinstance(v, (np.floating,)):
        f = float(v)
        return None if math.isnan(f) else f
    if isinstance(v, (np.bool_,)):
        return bool(v)
    if pd.isna(v):
        return None
    return v


def load_table(
    conn: sqlite3.Connection,
    table_name: str,
    df: pd.DataFrame,
) -> int:
    """INSERT OR REPLACE rows from a DataFrame into the given table.

    Wraps the operation in a transaction. Uses parameterized queries.

    Returns the number of rows loaded.
    """
    if df is None or df.empty:
        logger.info("  %s: no data to load, skipping", table_name)
        return 0

    columns = list(df.columns)
    placeholders = ", ".join(["?"] * len(columns))
    col_names = ", ".join(columns)
    sql = f"INSERT OR REPLACE INTO {table_name} ({col_names}) VALUES ({placeholders})"

    # Convert all values to SQLite-compatible Python types
    rows = [
        [_sanitize_value(v) for v in row]
        for row in df.itertuples(index=False, name=None)
    ]

    try:
        cursor = conn.cursor()
        # Disable foreign key checks during bulk load — Statcast data
        # contains player IDs that may not exist in the players table yet
        cursor.execute("PRAGMA foreign_keys = OFF")
        cursor.execute("BEGIN")
        cursor.executemany(sql, rows)
        conn.commit()
        cursor.execute("PRAGMA foreign_keys = ON")
        loaded = len(rows)
        logger.info("  %s: loaded %d rows", table_name, loaded)
        return loaded
    except Exception:
        conn.rollback()
        cursor.execute("PRAGMA foreign_keys = ON")
        logger.exception("  %s: failed to load data", table_name)
        raise


def load_all(
    conn: sqlite3.Connection,
    transformed_data: dict[str, pd.DataFrame],
) -> int:
    """Load all transformed DataFrames into the database in dependency order.

    Parameters
    ----------
    conn : sqlite3.Connection
        Active database connection.
    transformed_data : dict
        Mapping of table_name -> DataFrame.

    Returns
    -------
    int
        Total number of rows loaded across all tables.
    """
    total_rows = 0

    for table_name in _LOAD_ORDER:
        if table_name in transformed_data:
            df = transformed_data[table_name]
            try:
                loaded = load_table(conn, table_name, df)
                total_rows += loaded
            except Exception:
                logger.exception("Failed to load table %s, continuing", table_name)

    # Load any remaining tables not in the predefined order
    for table_name, df in transformed_data.items():
        if table_name not in _LOAD_ORDER:
            try:
                loaded = load_table(conn, table_name, df)
                total_rows += loaded
            except Exception:
                logger.exception("Failed to load table %s, continuing", table_name)

    logger.info("Total rows loaded: %d", total_rows)
    return total_rows
