"""SQLite connection helper and table management for SecondBase."""

import sqlite3
from pathlib import Path

import pandas as pd

from pipeline.config import DB_PATH, PROJECT_ROOT


SCHEMA_PATH = PROJECT_ROOT / "src" / "db" / "schema.sql"


def get_connection() -> sqlite3.Connection:
    """Return a sqlite3 connection to the SecondBase database."""
    conn = sqlite3.connect(str(DB_PATH))
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    conn.row_factory = sqlite3.Row
    return conn


def create_tables() -> None:
    """Read src/db/schema.sql and execute it to create all tables."""
    schema_sql = SCHEMA_PATH.read_text()
    conn = get_connection()
    try:
        conn.executescript(schema_sql)
        conn.commit()
    finally:
        conn.close()


def insert_dataframe(
    conn: sqlite3.Connection, table_name: str, df: pd.DataFrame
) -> int:
    """INSERT OR REPLACE rows from a DataFrame into the given table.

    Uses the DataFrame column names as the target columns.
    Returns the number of rows inserted.
    """
    if df is None or df.empty:
        return 0

    columns = list(df.columns)
    placeholders = ", ".join(["?"] * len(columns))
    col_names = ", ".join(columns)
    sql = f"INSERT OR REPLACE INTO {table_name} ({col_names}) VALUES ({placeholders})"

    rows = df.where(df.notna(), None).values.tolist()
    cursor = conn.executemany(sql, rows)
    return cursor.rowcount if cursor.rowcount else len(rows)
