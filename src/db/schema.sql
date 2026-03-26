-- SecondBase Database Schema

CREATE TABLE IF NOT EXISTS players (
  player_id INTEGER PRIMARY KEY,
  full_name TEXT NOT NULL,
  team TEXT,
  position TEXT,
  bats TEXT,
  throws TEXT,
  headshot_url TEXT,
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS batter_hot_zones (
  player_id INTEGER NOT NULL,
  season INTEGER NOT NULL,
  period TEXT NOT NULL DEFAULT 'season',
  zone_id INTEGER NOT NULL,
  woba REAL,
  ba REAL,
  slg REAL,
  sample_size INTEGER DEFAULT 0,
  PRIMARY KEY (player_id, season, period, zone_id),
  FOREIGN KEY (player_id) REFERENCES players(player_id)
);

CREATE TABLE IF NOT EXISTS pitcher_tendencies (
  player_id INTEGER NOT NULL,
  season INTEGER NOT NULL,
  pitch_type TEXT NOT NULL,
  batter_hand TEXT NOT NULL,
  usage_pct REAL,
  avg_velocity REAL,
  avg_h_break REAL,
  avg_v_break REAL,
  zone_distribution TEXT,  -- JSON: { "zone_id": frequency_pct }
  PRIMARY KEY (player_id, season, pitch_type, batter_hand),
  FOREIGN KEY (player_id) REFERENCES players(player_id)
);

CREATE TABLE IF NOT EXISTS batter_vs_pitch_type (
  player_id INTEGER NOT NULL,
  season INTEGER NOT NULL,
  pitch_type TEXT NOT NULL,
  pitcher_hand TEXT NOT NULL,
  pa INTEGER DEFAULT 0,
  ba REAL,
  slg REAL,
  woba REAL,
  whiff_pct REAL,
  avg_exit_velo REAL,
  avg_launch_angle REAL,
  PRIMARY KEY (player_id, season, pitch_type, pitcher_hand),
  FOREIGN KEY (player_id) REFERENCES players(player_id)
);

CREATE TABLE IF NOT EXISTS batter_spray_chart (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id INTEGER NOT NULL,
  season INTEGER NOT NULL,
  game_pk INTEGER,
  at_bat_number INTEGER,
  hc_x REAL,
  hc_y REAL,
  exit_velo REAL,
  launch_angle REAL,
  result TEXT,
  pitch_type TEXT,
  pitcher_hand TEXT,
  game_date TEXT,
  UNIQUE (player_id, game_pk, at_bat_number),
  FOREIGN KEY (player_id) REFERENCES players(player_id)
);

CREATE TABLE IF NOT EXISTS matchup_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  batter_id INTEGER NOT NULL,
  pitcher_id INTEGER NOT NULL,
  game_pk INTEGER,
  game_date TEXT,
  at_bat_number INTEGER,
  pitch_sequence TEXT,  -- JSON array of pitch details
  result TEXT,
  exit_velo REAL,
  launch_angle REAL,
  UNIQUE (batter_id, pitcher_id, game_pk, at_bat_number),
  FOREIGN KEY (batter_id) REFERENCES players(player_id),
  FOREIGN KEY (pitcher_id) REFERENCES players(player_id)
);

-- Pipeline operational tables

CREATE TABLE IF NOT EXISTS pipeline_state (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS pipeline_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_type TEXT NOT NULL,
  started_at TEXT DEFAULT (datetime('now')),
  completed_at TEXT,
  status TEXT DEFAULT 'running',
  rows_processed INTEGER DEFAULT 0,
  error_message TEXT
);

CREATE TABLE IF NOT EXISTS zone_grid (
  zone_id INTEGER PRIMARY KEY,
  row_idx INTEGER NOT NULL,
  col_idx INTEGER NOT NULL,
  x_min REAL NOT NULL,
  x_max REAL NOT NULL,
  z_min REAL NOT NULL,
  z_max REAL NOT NULL
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_hot_zones_lookup ON batter_hot_zones(player_id, season, period);
CREATE INDEX IF NOT EXISTS idx_tendencies_lookup ON pitcher_tendencies(player_id, season, batter_hand);
CREATE INDEX IF NOT EXISTS idx_bvpt_lookup ON batter_vs_pitch_type(player_id, season, pitcher_hand);
CREATE INDEX IF NOT EXISTS idx_spray_lookup ON batter_spray_chart(player_id, season);
CREATE INDEX IF NOT EXISTS idx_matchup_lookup ON matchup_history(batter_id, pitcher_id);
CREATE INDEX IF NOT EXISTS idx_spray_game ON batter_spray_chart(game_pk);
CREATE INDEX IF NOT EXISTS idx_matchup_game ON matchup_history(game_pk);

-- Populate zone grid (5x5, bottom-left to top-right)
-- Horizontal: -1.25 to +1.25 ft (5 bands of 0.5 ft)
-- Vertical: 1.0 to 4.0 ft (5 bands of 0.6 ft)
INSERT OR IGNORE INTO zone_grid (zone_id, row_idx, col_idx, x_min, x_max, z_min, z_max) VALUES
  (1,  0, 0, -1.25, -0.75, 1.0, 1.6),
  (2,  0, 1, -0.75, -0.25, 1.0, 1.6),
  (3,  0, 2, -0.25,  0.25, 1.0, 1.6),
  (4,  0, 3,  0.25,  0.75, 1.0, 1.6),
  (5,  0, 4,  0.75,  1.25, 1.0, 1.6),
  (6,  1, 0, -1.25, -0.75, 1.6, 2.2),
  (7,  1, 1, -0.75, -0.25, 1.6, 2.2),
  (8,  1, 2, -0.25,  0.25, 1.6, 2.2),
  (9,  1, 3,  0.25,  0.75, 1.6, 2.2),
  (10, 1, 4,  0.75,  1.25, 1.6, 2.2),
  (11, 2, 0, -1.25, -0.75, 2.2, 2.8),
  (12, 2, 1, -0.75, -0.25, 2.2, 2.8),
  (13, 2, 2, -0.25,  0.25, 2.2, 2.8),
  (14, 2, 3,  0.25,  0.75, 2.2, 2.8),
  (15, 2, 4,  0.75,  1.25, 2.2, 2.8),
  (16, 3, 0, -1.25, -0.75, 2.8, 3.4),
  (17, 3, 1, -0.75, -0.25, 2.8, 3.4),
  (18, 3, 2, -0.25,  0.25, 2.8, 3.4),
  (19, 3, 3,  0.25,  0.75, 2.8, 3.4),
  (20, 3, 4,  0.75,  1.25, 2.8, 3.4),
  (21, 4, 0, -1.25, -0.75, 3.4, 4.0),
  (22, 4, 1, -0.75, -0.25, 3.4, 4.0),
  (23, 4, 2, -0.25,  0.25, 3.4, 4.0),
  (24, 4, 3,  0.25,  0.75, 3.4, 4.0),
  (25, 4, 4,  0.75,  1.25, 3.4, 4.0);
