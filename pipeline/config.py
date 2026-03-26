import os
from pathlib import Path

# Paths
PROJECT_ROOT = Path(__file__).parent.parent
DATA_DIR = PROJECT_ROOT / "data"
RAW_DIR = DATA_DIR / "raw"
DB_PATH = DATA_DIR / "secondbase.db"
LOG_PATH = DATA_DIR / "pipeline.log"

# Ensure directories exist
DATA_DIR.mkdir(exist_ok=True)
RAW_DIR.mkdir(exist_ok=True)

# MLB Stats API
MLB_API_BASE = "https://statsapi.mlb.com/api/v1"

# Zone grid configuration (5x5)
ZONE_H_MIN = -1.25  # feet from center of plate
ZONE_H_MAX = 1.25
ZONE_H_BANDS = 5
ZONE_V_MIN = 1.0  # feet above ground
ZONE_V_MAX = 4.0
ZONE_V_BANDS = 5

# Seasons to process
DEFAULT_SEASONS = [2024, 2025, 2026]

# Statcast fetch chunk size (days)
FETCH_CHUNK_DAYS = 7

# Pitch type mapping (Statcast codes to display names)
PITCH_TYPE_MAP = {
    "FF": "4-Seam Fastball",
    "SI": "Sinker",
    "FC": "Cutter",
    "SL": "Slider",
    "CU": "Curveball",
    "CH": "Changeup",
    "FS": "Splitter",
    "KC": "Knuckle Curve",
    "ST": "Sweeper",
    "SV": "Screwball",
    "KN": "Knuckleball",
    "EP": "Eephus",
    "CS": "Slow Curve",
    "FO": "Forkball",
    "SC": "Screwball",
}
