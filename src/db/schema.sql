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

-- P1 Analytics tables

CREATE TABLE IF NOT EXISTS pitcher_count_tendencies (
  player_id INTEGER NOT NULL,
  season INTEGER NOT NULL,
  batter_hand TEXT NOT NULL,
  balls INTEGER NOT NULL,
  strikes INTEGER NOT NULL,
  pitch_type TEXT NOT NULL,
  usage_pct REAL,
  sample_size INTEGER DEFAULT 0,
  zone_distribution TEXT,  -- JSON: { "zone_id": frequency_pct }
  PRIMARY KEY (player_id, season, batter_hand, balls, strikes, pitch_type),
  FOREIGN KEY (player_id) REFERENCES players(player_id)
);

CREATE TABLE IF NOT EXISTS win_expectancy (
  inning INTEGER NOT NULL,
  half TEXT NOT NULL,        -- 'top' or 'bottom'
  outs INTEGER NOT NULL,
  runner_state TEXT NOT NULL, -- '000' through '111'
  score_diff INTEGER NOT NULL,
  home_wp REAL NOT NULL,
  PRIMARY KEY (inning, half, outs, runner_state, score_diff)
);

CREATE TABLE IF NOT EXISTS pitcher_tto_splits (
  player_id INTEGER NOT NULL,
  season INTEGER NOT NULL,
  times_through INTEGER NOT NULL,  -- 1, 2, or 3
  pa INTEGER DEFAULT 0,
  ba REAL,
  slg REAL,
  woba REAL,
  k_pct REAL,
  bb_pct REAL,
  avg_exit_velo REAL,
  PRIMARY KEY (player_id, season, times_through),
  FOREIGN KEY (player_id) REFERENCES players(player_id)
);

CREATE TABLE IF NOT EXISTS umpires (
  umpire_id INTEGER PRIMARY KEY,
  umpire_name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS umpire_zones (
  umpire_id INTEGER NOT NULL,
  season INTEGER NOT NULL,
  zone_id INTEGER NOT NULL,  -- 1-25
  called_strike_pct REAL,
  sample_size INTEGER DEFAULT 0,
  PRIMARY KEY (umpire_id, season, zone_id),
  FOREIGN KEY (umpire_id) REFERENCES umpires(umpire_id)
);

CREATE TABLE IF NOT EXISTS umpire_stats (
  umpire_id INTEGER NOT NULL,
  season INTEGER NOT NULL,
  games INTEGER DEFAULT 0,
  accuracy_pct REAL,
  expanded_zone_rate REAL,
  consistency_rating REAL,
  PRIMARY KEY (umpire_id, season),
  FOREIGN KEY (umpire_id) REFERENCES umpires(umpire_id)
);

CREATE TABLE IF NOT EXISTS league_pitch_averages (
  season INTEGER NOT NULL,
  pitch_type TEXT NOT NULL,
  pitcher_hand TEXT NOT NULL,
  avg_velocity REAL,
  avg_h_break REAL,
  avg_v_break REAL,
  sample_size INTEGER DEFAULT 0,
  PRIMARY KEY (season, pitch_type, pitcher_hand)
);

CREATE TABLE IF NOT EXISTS batter_count_stats (
  player_id INTEGER NOT NULL,
  season INTEGER NOT NULL,
  balls INTEGER NOT NULL,
  strikes INTEGER NOT NULL,
  pa INTEGER DEFAULT 0,
  ba REAL,
  slg REAL,
  woba REAL,
  k_pct REAL,
  bb_pct REAL,
  PRIMARY KEY (player_id, season, balls, strikes),
  FOREIGN KEY (player_id) REFERENCES players(player_id)
);

-- P2 Analytics tables

CREATE TABLE IF NOT EXISTS batter_game_stats (
  player_id INTEGER NOT NULL,
  season INTEGER NOT NULL,
  game_date TEXT NOT NULL,
  game_pk INTEGER,
  pa INTEGER DEFAULT 0,
  ab INTEGER DEFAULT 0,
  h INTEGER DEFAULT 0,
  total_bases INTEGER DEFAULT 0,
  bb INTEGER DEFAULT 0,
  k INTEGER DEFAULT 0,
  woba_value_sum REAL DEFAULT 0,
  woba_denom_sum REAL DEFAULT 0,
  avg_exit_velo REAL,
  PRIMARY KEY (player_id, season, game_date),
  FOREIGN KEY (player_id) REFERENCES players(player_id)
);

CREATE TABLE IF NOT EXISTS pitcher_game_stats (
  player_id INTEGER NOT NULL,
  season INTEGER NOT NULL,
  game_date TEXT NOT NULL,
  game_pk INTEGER,
  pa_against INTEGER DEFAULT 0,
  ab_against INTEGER DEFAULT 0,
  h_against INTEGER DEFAULT 0,
  hr_against INTEGER DEFAULT 0,
  bb_against INTEGER DEFAULT 0,
  k INTEGER DEFAULT 0,
  outs_recorded INTEGER DEFAULT 0,
  game_score INTEGER,
  PRIMARY KEY (player_id, season, game_date),
  FOREIGN KEY (player_id) REFERENCES players(player_id)
);

CREATE TABLE IF NOT EXISTS pitch_tunneling (
  player_id INTEGER NOT NULL,
  season INTEGER NOT NULL,
  pitch_type_a TEXT NOT NULL,
  pitch_type_b TEXT NOT NULL,
  tunnel_score REAL,
  decision_point_distance_ft REAL,
  separation_at_decision_in REAL,
  separation_at_plate_in REAL,
  release_x_a REAL, release_z_a REAL,
  release_x_b REAL, release_z_b REAL,
  velocity_a REAL, velocity_b REAL,
  pfx_x_a REAL, pfx_z_a REAL,
  pfx_x_b REAL, pfx_z_b REAL,
  plate_x_a REAL, plate_z_a REAL,
  plate_x_b REAL, plate_z_b REAL,
  extension_a REAL, extension_b REAL,
  sample_a INTEGER DEFAULT 0, sample_b INTEGER DEFAULT 0,
  PRIMARY KEY (player_id, season, pitch_type_a, pitch_type_b),
  FOREIGN KEY (player_id) REFERENCES players(player_id)
);

CREATE TABLE IF NOT EXISTS batter_defensive_alignment (
  player_id INTEGER NOT NULL,
  season INTEGER NOT NULL,
  if_standard_pct REAL,
  if_shade_pct REAL,
  if_strategic_pct REAL,
  of_standard_pct REAL,
  of_strategic_pct REAL,
  total_pa INTEGER DEFAULT 0,
  pull_pct REAL,
  center_pct REAL,
  oppo_pct REAL,
  PRIMARY KEY (player_id, season),
  FOREIGN KEY (player_id) REFERENCES players(player_id)
);

-- User accounts and sessions

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  expires_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_favorite_teams (
  user_id INTEGER NOT NULL,
  team_id INTEGER NOT NULL,
  PRIMARY KEY (user_id, team_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_favorite_players (
  user_id INTEGER NOT NULL,
  player_id INTEGER NOT NULL,
  PRIMARY KEY (user_id, player_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_hot_zones_lookup ON batter_hot_zones(player_id, season, period);
CREATE INDEX IF NOT EXISTS idx_tendencies_lookup ON pitcher_tendencies(player_id, season, batter_hand);
CREATE INDEX IF NOT EXISTS idx_bvpt_lookup ON batter_vs_pitch_type(player_id, season, pitcher_hand);
CREATE INDEX IF NOT EXISTS idx_spray_lookup ON batter_spray_chart(player_id, season);
CREATE INDEX IF NOT EXISTS idx_matchup_lookup ON matchup_history(batter_id, pitcher_id);
CREATE INDEX IF NOT EXISTS idx_spray_game ON batter_spray_chart(game_pk);
CREATE INDEX IF NOT EXISTS idx_matchup_game ON matchup_history(game_pk);
CREATE INDEX IF NOT EXISTS idx_count_tend_lookup ON pitcher_count_tendencies(player_id, season, batter_hand, balls, strikes);
CREATE INDEX IF NOT EXISTS idx_tto_lookup ON pitcher_tto_splits(player_id, season);
CREATE INDEX IF NOT EXISTS idx_umpire_zones_lookup ON umpire_zones(umpire_id, season);
CREATE INDEX IF NOT EXISTS idx_league_avg_lookup ON league_pitch_averages(season, pitcher_hand);
CREATE INDEX IF NOT EXISTS idx_batter_count_lookup ON batter_count_stats(player_id, season);
CREATE INDEX IF NOT EXISTS idx_batter_game_lookup ON batter_game_stats(player_id, season, game_date);
CREATE INDEX IF NOT EXISTS idx_pitcher_game_lookup ON pitcher_game_stats(player_id, season, game_date);
CREATE INDEX IF NOT EXISTS idx_def_align_lookup ON batter_defensive_alignment(player_id, season);
CREATE INDEX IF NOT EXISTS idx_tunneling_lookup ON pitch_tunneling(player_id, season);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_fav_teams_user ON user_favorite_teams(user_id);
CREATE INDEX IF NOT EXISTS idx_fav_players_user ON user_favorite_players(user_id);

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
