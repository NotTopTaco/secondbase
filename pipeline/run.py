"""CLI orchestrator for the SecondBase data pipeline.

Usage:
    python -m pipeline.run --full --season 2026
    python -m pipeline.run --incremental --days 7
"""

import argparse
import logging
import sys
from datetime import datetime, timedelta

import pandas as pd

from pipeline.config import DATA_DIR, LOG_PATH

# ---------------------------------------------------------------------------
# Logging setup (must happen before other pipeline imports that use loggers)
# ---------------------------------------------------------------------------

LOG_FORMAT = "%(asctime)s [%(levelname)s] %(name)s: %(message)s"


def _setup_logging() -> None:
    """Configure logging to both console and data/pipeline.log."""
    DATA_DIR.mkdir(exist_ok=True)

    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)

    # Console handler
    console = logging.StreamHandler(sys.stdout)
    console.setLevel(logging.INFO)
    console.setFormatter(logging.Formatter(LOG_FORMAT))
    root_logger.addHandler(console)

    # File handler
    file_handler = logging.FileHandler(str(LOG_PATH), mode="a")
    file_handler.setLevel(logging.INFO)
    file_handler.setFormatter(logging.Formatter(LOG_FORMAT))
    root_logger.addHandler(file_handler)


_setup_logging()
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Pipeline imports (after logging is configured)
# ---------------------------------------------------------------------------

from pipeline.db import create_tables, get_connection  # noqa: E402
from pipeline.fetch.savant import fetch_statcast  # noqa: E402
from pipeline.fetch.mlb_api import fetch_all_players  # noqa: E402
from pipeline.transform.players import transform_players  # noqa: E402
from pipeline.transform.hot_zones import transform_hot_zones  # noqa: E402
from pipeline.transform.pitcher_tendencies import transform_pitcher_tendencies  # noqa: E402
from pipeline.transform.batter_vs_pitch import transform_batter_vs_pitch  # noqa: E402
from pipeline.transform.spray_chart import transform_spray_chart  # noqa: E402
from pipeline.transform.matchup_history import transform_matchup_history  # noqa: E402
from pipeline.load.loader import load_all  # noqa: E402


# ---------------------------------------------------------------------------
# Pipeline run tracking
# ---------------------------------------------------------------------------


def _record_run_start(conn, run_type: str) -> int:
    """Insert a pipeline_runs row and return its id."""
    cursor = conn.execute(
        "INSERT INTO pipeline_runs (run_type, status) VALUES (?, 'running')",
        (run_type,),
    )
    conn.commit()
    return cursor.lastrowid


def _record_run_end(
    conn, run_id: int, status: str, rows: int, error_msg: str | None = None
) -> None:
    """Update the pipeline_runs row with completion info."""
    conn.execute(
        """UPDATE pipeline_runs
           SET completed_at = datetime('now'),
               status = ?,
               rows_processed = ?,
               error_message = ?
         WHERE id = ?""",
        (status, rows, error_msg, run_id),
    )
    conn.commit()


# ---------------------------------------------------------------------------
# Full pipeline
# ---------------------------------------------------------------------------


def run_full(season: int) -> None:
    """Run the full pipeline: fetch entire season, transform, load."""
    logger.info("=" * 60)
    logger.info("Starting FULL pipeline run for season %d", season)
    logger.info("=" * 60)

    # Ensure tables exist
    create_tables()
    conn = get_connection()
    run_id = _record_run_start(conn, "full")
    total_rows = 0

    try:
        # --- Fetch ---
        logger.info("--- FETCH: Players ---")
        raw_players = fetch_all_players(season)

        logger.info("--- FETCH: Statcast ---")
        start_date = f"{season}-02-20"
        today = datetime.now().strftime("%Y-%m-%d")
        end_of_season = f"{season}-11-15"
        end_date = min(today, end_of_season)
        statcast_df = fetch_statcast(start_date, end_date)

        # --- Transform ---
        logger.info("--- TRANSFORM: Players ---")
        players_df = transform_players(raw_players)

        logger.info("--- TRANSFORM: Hot Zones ---")
        hot_zones_df = transform_hot_zones(statcast_df, season, period="season")

        logger.info("--- TRANSFORM: Pitcher Tendencies ---")
        pitcher_tend_df = transform_pitcher_tendencies(statcast_df, season)

        logger.info("--- TRANSFORM: Batter vs Pitch Type ---")
        bvpt_df = transform_batter_vs_pitch(statcast_df, season)

        logger.info("--- TRANSFORM: Spray Chart ---")
        spray_df = transform_spray_chart(statcast_df, season)

        logger.info("--- TRANSFORM: Matchup History ---")
        matchup_df = transform_matchup_history(statcast_df, season)

        # --- Load ---
        logger.info("--- LOAD ---")
        transformed = {
            "players": players_df,
            "batter_hot_zones": hot_zones_df,
            "pitcher_tendencies": pitcher_tend_df,
            "batter_vs_pitch_type": bvpt_df,
            "batter_spray_chart": spray_df,
            "matchup_history": matchup_df,
        }
        total_rows = load_all(conn, transformed)

        _record_run_end(conn, run_id, "completed", total_rows)
        logger.info("Full pipeline completed: %d total rows loaded", total_rows)

    except Exception as exc:
        logger.exception("Full pipeline failed")
        _record_run_end(conn, run_id, "failed", total_rows, str(exc))
        raise
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# Incremental pipeline
# ---------------------------------------------------------------------------


def run_incremental(season: int, days: int = 7) -> None:
    """Run an incremental update: fetch last N days, update affected tables."""
    logger.info("=" * 60)
    logger.info(
        "Starting INCREMENTAL pipeline run: season %d, last %d days",
        season,
        days,
    )
    logger.info("=" * 60)

    create_tables()
    conn = get_connection()
    run_id = _record_run_start(conn, "incremental")
    total_rows = 0

    try:
        # --- Fetch ---
        end_date = datetime.now().strftime("%Y-%m-%d")
        start_date = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")

        logger.info("--- FETCH: Statcast (%s to %s) ---", start_date, end_date)
        statcast_df = fetch_statcast(start_date, end_date)

        if statcast_df.empty:
            logger.info("No new Statcast data, nothing to update")
            _record_run_end(conn, run_id, "completed", 0)
            conn.close()
            return

        # Optionally refresh players too (incremental still updates them)
        logger.info("--- FETCH: Players ---")
        raw_players = fetch_all_players(season)

        # --- Transform ---
        logger.info("--- TRANSFORM: Players ---")
        players_df = transform_players(raw_players)

        logger.info("--- TRANSFORM: Hot Zones ---")
        hot_zones_df = transform_hot_zones(statcast_df, season, period="season")

        logger.info("--- TRANSFORM: Hot Zones (last30) ---")
        hot_zones_30_df = transform_hot_zones(statcast_df, season, period="last30")

        logger.info("--- TRANSFORM: Pitcher Tendencies ---")
        pitcher_tend_df = transform_pitcher_tendencies(statcast_df, season)

        logger.info("--- TRANSFORM: Batter vs Pitch Type ---")
        bvpt_df = transform_batter_vs_pitch(statcast_df, season)

        logger.info("--- TRANSFORM: Spray Chart ---")
        spray_df = transform_spray_chart(statcast_df, season)

        logger.info("--- TRANSFORM: Matchup History ---")
        matchup_df = transform_matchup_history(statcast_df, season)

        # Combine hot zones (season + last30)
        all_hot_zones = pd.concat(
            [hot_zones_df, hot_zones_30_df], ignore_index=True
        )

        # --- Load ---
        logger.info("--- LOAD ---")
        transformed = {
            "players": players_df,
            "batter_hot_zones": all_hot_zones,
            "pitcher_tendencies": pitcher_tend_df,
            "batter_vs_pitch_type": bvpt_df,
            "batter_spray_chart": spray_df,
            "matchup_history": matchup_df,
        }
        total_rows = load_all(conn, transformed)

        _record_run_end(conn, run_id, "completed", total_rows)
        logger.info(
            "Incremental pipeline completed: %d total rows loaded", total_rows
        )

    except Exception as exc:
        logger.exception("Incremental pipeline failed")
        _record_run_end(conn, run_id, "failed", total_rows, str(exc))
        raise
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------


def main() -> None:
    parser = argparse.ArgumentParser(
        description="SecondBase data pipeline",
        prog="python -m pipeline.run",
    )
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument(
        "--full",
        action="store_true",
        help="Run the full pipeline for an entire season",
    )
    mode.add_argument(
        "--incremental",
        action="store_true",
        help="Run an incremental update for the last N days",
    )
    parser.add_argument(
        "--season",
        type=int,
        default=datetime.now().year,
        help="Season year to process (default: current year)",
    )
    parser.add_argument(
        "--days",
        type=int,
        default=7,
        help="Days to look back for incremental mode (default: 7)",
    )

    args = parser.parse_args()

    if args.full:
        run_full(args.season)
    elif args.incremental:
        run_incremental(args.season, args.days)


if __name__ == "__main__":
    main()
