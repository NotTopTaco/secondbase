# Baseball Companion App — Product Requirements Document

**Version:** 1.0 Draft  
**Author:** [Your Name]  
**Date:** March 26, 2026  
**Status:** Draft  

---

## 1. Overview

### 1.1 Vision
A real-time, browser-based second-screen companion for watching live MLB games. The app syncs with the current game state and dynamically surfaces deep analytics, visual overlays, and predictive insights for the active batter-pitcher matchup — turning every at-bat into a data-rich experience.

### 1.2 Problem Statement
Watching a baseball game, fans are left relying on whatever stats the broadcast chooses to show — usually surface-level numbers (batting average, ERA) with no situational context. The richness of publicly available Statcast data goes almost entirely unused by casual and serious fans alike. There is no consumer-facing tool that brings pitch-level analytics into a live, synced viewing experience.

### 1.3 Target User
Primary user: the developer (personal tool). A lifelong Atlanta Braves fan who watches 100+ games per season and wants deeper insight into every at-bat without manually looking up stats. Comfortable with data-dense interfaces. Prioritizes depth and accuracy over simplicity.

### 1.4 Platform
Browser-based web application, optimized for a secondary monitor or tablet propped up next to the TV. Responsive but not mobile-first — assumes a screen width of at least 768px (tablet landscape or larger).

---

## 2. Data Sources & Game Sync

### 2.1 Primary Data Source: MLB Statscast / Game Feed API
- **MLB Stats API** (`statsapi.mlb.com`) — free, unofficial but widely used. Provides real-time game feed with pitch-by-pitch data, lineups, play results, and game state.
- **Endpoint:** `/api/v1.1/game/{gamePk}/feed/live` — returns full live game data including current batter, pitcher, count, runners, and pitch-level detail (type, velocity, location, result).
- **Polling interval:** Every 5–10 seconds during live play. API updates are near-real-time with typical delays of 5–15 seconds behind the broadcast.
- **Statcast data:** Pitch movement, exit velocity, launch angle, and sprint speed are available post-pitch through the same feed and supplemented by Baseball Savant CSV exports for historical/precomputed data.

### 2.2 Historical / Precomputed Data
- **Baseball Savant (Statcast Search)** — bulk CSV downloads for historical pitch data, spray charts, and batter/pitcher tendencies. Used to precompute hot zones, pitch tendency models, and matchup histories.
- **Data refresh cadence:** Nightly batch job pulls the previous day's data and updates player models.

### 2.3 Game Sync Mechanism
- **Auto-sync (primary):** User selects the Braves game (or any game) from today's schedule. The app polls the MLB Game Feed API and automatically tracks the current inning, at-bat, batter, and pitcher. Game state drives all dynamic panels.
- **Manual override (fallback):** Searchable dropdowns for batter and pitcher in case the API drifts, lags, or the user wants to look ahead at upcoming matchups. Manual selections are flagged visually so the user knows they've overridden live sync.
- **Broadcast delay compensation:** Configurable delay offset (0–60 seconds) to sync with the MLB.TV stream, which typically runs 30–60 seconds behind real-time. Default: 45 seconds. The app should allow fine-tuning in 5-second increments so the pitch data appears just *after* you see it on screen.

---

## 3. Features — Prioritized

Features are organized into three tiers:

- **P0 (MVP):** The core experience. Ship these first.
- **P1 (Fast Follow):** High-value additions that deepen the experience.
- **P2 (Future):** Ambitious features for later iterations.

---

### 3.0 Layout & Navigation

#### 3.0.1 Game Selection Screen
- On load, display today's MLB schedule with game times, teams, and status (Pre-game / Live / Final).
- Default highlight: Atlanta Braves game (if scheduled).
- One-click to enter a game's companion view.

#### 3.0.2 Main Companion Layout
A dashboard-style layout with a persistent **game state bar** at the top and configurable panels below. The layout adapts based on screen size but targets a two- or three-column grid.

**Game State Bar (persistent, top):**
- Teams, score, inning (top/bottom), outs, count (balls-strikes), runner positions (diamond graphic).
- Current batter name + photo, current pitcher name + photo.
- Game status indicator (Live / Delayed / Final).

**Panel Grid (below):**
Panels are the core content units. Each panel is a self-contained widget displaying a specific feature (strike zone, spray chart, stats table, etc.). User can rearrange or collapse panels. Default layout is prescribed per the feature tiers below.

---

### 3.1 P0 — MVP Features

#### 3.1.1 Live Strike Zone Display
**Description:** A real-time strike zone graphic that plots each pitch of the current at-bat as it happens.

**Requirements:**
- Render the strike zone as a rectangle scaled to the current batter's height (use player bio data from API).
- Plot each pitch as a colored dot:
  - Color by pitch type (fastball = red, slider = blue, changeup = green, curveball = yellow, cutter = orange, sinker = pink — with legend).
  - Shape indicates result: filled circle = called strike/swinging strike, open circle = ball, X = foul, diamond = in play.
- Show the pitch sequence number (1, 2, 3…) inside or adjacent to each dot.
- Display pitch velocity next to each dot.
- On hover/click: show full detail tooltip (pitch type, velocity, spin rate, horizontal/vertical break, call result).
- After the at-bat concludes, briefly show the full sequence before clearing for the next batter.
- Include a toggle to overlay the **umpire's historical strike zone** (see 3.2.5) as a shaded region.

#### 3.1.2 Batter Hot Zone / Cold Zone Heatmap
**Description:** A heatmap overlaid on the strike zone showing where the current batter hits well and where they struggle.

**Requirements:**
- Divide the strike zone (and surrounding chase zones) into a grid (minimum 9 zones, ideally 25 for granularity).
- Color each zone by the batter's performance metric in that zone:
  - Default metric: **wOBA** (weighted on-base average) — best single measure of offensive production by zone.
  - Toggle options: batting average, slugging %, whiff rate.
- Color scale: deep blue (cold / weak) → white (neutral) → deep red (hot / strong).
- Data source: precomputed from Statcast pitch-location data for the current season. Option to toggle to "career" or "last 30 days."
- Displayed as a semi-transparent overlay on the strike zone, toggleable on/off so it doesn't clutter the live pitch plot.

#### 3.1.3 Pitcher Tendency Map
**Description:** A visual showing where this pitcher typically locates each pitch type.

**Requirements:**
- Same zone grid as the hot zone display, but from the pitcher's perspective.
- Render as a cluster/density plot or heatmap per pitch type.
- Filter by: pitch type (show one at a time or all overlaid with transparency), batter handedness (auto-set to current batter's handedness), count (all counts, ahead, behind, two-strike, etc.).
- Annotations: show the pitcher's usage % for each pitch type (e.g., "4-Seam: 38%, Slider: 27%, Changeup: 22%, Curve: 13%").
- Data source: precomputed from current season Statcast data.

#### 3.1.4 Batter vs. Pitch Type Stats Table
**Description:** A stats table showing how the current batter performs against each pitch type and pitcher handedness.

**Requirements:**
- Rows: each pitch type the batter has faced (4-Seam, Sinker, Slider, Curveball, Changeup, Cutter, etc.).
- Columns: PA (plate appearances), BA, SLG, wOBA, Whiff%, Exit Velo (avg), Launch Angle (avg).
- Highlight the pitch types the current pitcher throws (bold or color-coded row).
- Split toggle: vs. LHP / vs. RHP (auto-default to the current pitcher's handedness).
- Season selector: current season, career, or last 30 days.

#### 3.1.5 Spray Chart
**Description:** A field diagram showing where this batter's batted balls land.

**Requirements:**
- Render a top-down baseball diamond/outfield graphic.
- Plot each batted ball event as a dot:
  - Color by result: single (blue), double (green), triple (orange), home run (red), out (gray).
  - Size or opacity can encode exit velocity.
- Show percentage pull / center / opposite field in a summary bar above the chart.
- Filter by: pitch type, pitcher handedness, current season vs. career.
- On hover: show exit velocity, launch angle, pitch type, and game date.

#### 3.1.6 Head-to-Head Matchup History
**Description:** A complete at-bat-by-at-bat log of the current batter vs. the current pitcher.

**Requirements:**
- Chronological list of every at-bat between these two players.
- Each entry shows: date, pitch count, pitch sequence (abbreviated: FF, SL, CH…), result (K, BB, 1B, HR, etc.).
- Summary stats at top: total PAs, BA, SLG, K%, BB%.
- If no history exists, display "First career meeting" with a note about how the batter performs against similar pitcher profiles (same handedness + similar pitch mix).

---

### 3.2 P1 — Fast Follow Features

#### 3.2.1 Next Pitch Probability
**Description:** A predictive model estimating what pitch type and location the pitcher will throw next.

**Requirements:**
- Display a ranked list of pitch types with probability percentages (e.g., "4-Seam 42%, Slider 31%, Changeup 18%, Curve 9%").
- Factors: current count, pitcher's historical tendencies in this count, batter handedness, inning, score differential, runners on base.
- Model: Start simple — conditional probability tables derived from the pitcher's own Statcast history. Graduate to a lightweight ML model (logistic regression or random forest) trained on Statcast data.
- Location prediction: overlay a "most likely location" zone on the strike zone graphic (shaded region showing the highest-density area for the predicted pitch type in this count).
- Accuracy tracker: over the course of the game, track what % of predictions were correct (pitch type only). Display as a small "Model: 34% accuracy" badge. Honest and transparent — baseball is hard to predict.

#### 3.2.2 Win Probability Graph
**Description:** A live-updating line chart showing each team's win probability over the course of the game.

**Requirements:**
- X-axis: game events (each plate appearance or play). Y-axis: home team win probability (0–100%).
- Update after every play (not every pitch — too noisy).
- Show the current win probability prominently (e.g., "Braves 67.3%").
- On hover over any point: show the event that caused the shift (e.g., "Austin Riley 2-run HR, +18.4%").
- Data: can be computed locally using a lookup table (historical win expectancy by inning/score/outs/runners) or pulled from a third-party source.
- Highlight the single biggest win probability swing of the game.

#### 3.2.3 Pitcher Fatigue & Velocity Tracker
**Description:** A real-time chart tracking the pitcher's velocity over the course of the game, with fatigue indicators.

**Requirements:**
- Line chart: X-axis = pitch number (1, 2, 3…), Y-axis = velocity (mph).
- Separate line per pitch type (color-coded to match the strike zone legend).
- Overlay a shaded "normal range" band for each pitch type based on the pitcher's season averages.
- **Fatigue flag:** When velocity drops more than 1.5 mph below the pitcher's season average for that pitch type over a rolling 5-pitch window, show a visual alert (e.g., a yellow/red indicator + "Velocity dropping").
- Summary stats: avg velocity by pitch type for this game vs. season average.
- Historical overlay toggle: show the pitcher's velocity curve from their last 3 starts as faded background lines for comparison.

#### 3.2.4 Time Through the Order Splits
**Description:** Show how the current pitcher's effectiveness changes the 1st, 2nd, and 3rd time through the batting order.

**Requirements:**
- Three-column stat block: "1st time" / "2nd time" / "3rd time."
- Metrics: BA against, SLG against, K%, BB%, wOBA against, avg exit velo against.
- Highlight the current pass-through (e.g., if the batter is seeing this pitcher for the 2nd time today, highlight the 2nd column).
- Color code: green (pitcher is better), red (pitcher is worse) relative to their overall season line.
- Source: precomputed from season-level Statcast data.

#### 3.2.5 Umpire Scouting Report
**Description:** Show the home plate umpire's historical strike zone tendencies.

**Requirements:**
- Identify the home plate umpire from the game feed API (available in the boxscore endpoint).
- Display the umpire's historical strike zone as a shaded overlay, showing where they tend to call strikes outside the rulebook zone and where they squeeze.
- Key stats: overall accuracy %, expanded zone call rate, consistency rating (does the zone shift during the game?).
- Compare to the league average zone.
- Source: precomputed from historical pitch-level data (Baseball Savant provides umpire-level data).
- Toggleable as an overlay on the main strike zone display (see 3.1.1).

#### 3.2.6 Pitch Movement Visualization
**Description:** A chart showing how much each of the pitcher's pitch types moves (breaks) compared to league average.

**Requirements:**
- Scatter plot or arrow diagram: X-axis = horizontal break (inches), Y-axis = induced vertical break (inches).
- Each pitch type is a labeled cluster or single point (season average).
- Overlay league average positions for each pitch type as hollow circles or crosshairs.
- Helps answer: "Why is this pitcher's slider so nasty?" (e.g., more horizontal break than average).
- Source: precomputed from Statcast movement data.

#### 3.2.7 Bullpen Status Panel
**Description:** An at-a-glance view of each team's bullpen availability.

**Requirements:**
- List of all relief pitchers for both teams.
- For each reliever: name, ERA, handedness, pitches thrown yesterday / today, availability status (estimated: Available / Limited / Unavailable based on recent usage).
- Sort by leverage/usage role (closer → setup → middle relief).
- Highlight the pitcher currently warming up (if detectable from game feed).

#### 3.2.8 Batter Performance by Count
**Description:** Show how the current batter performs in different count states.

**Requirements:**
- Grid or table: rows are count states (0-0, 1-0, 0-1, 2-0, 1-1, 0-2, 3-0, 2-1, 1-2, 3-1, 2-2, 3-2).
- Columns: number of PAs reaching that count, BA, SLG, K% (for 2-strike counts), BB% (for 3-ball counts).
- Highlight the current count in the at-bat.
- Color code cells by performance (red = hot, blue = cold).

---

### 3.3 P2 — Future Features

#### 3.3.1 Pitch Tunneling Visualization
**Description:** An animated or side-by-side view showing how two different pitch types from this pitcher look nearly identical out of the hand before diverging.

**Requirements:**
- Show the trajectory of two pitches overlaid from the pitcher's release point to the plate.
- Highlight the "tunnel point" — where the pitches diverge beyond the batter's decision threshold (~175ms before the plate).
- Explain *why* the batter swung at a bad pitch (the pitches were indistinguishable at the decision point).
- Likely requires 3D trajectory modeling from Statcast data (x, y, z coordinates at multiple time points).

#### 3.3.2 Defensive Positioning Overlay
**Description:** Show where the fielders are positioned for this batter and highlight the gaps.

**Requirements:**
- Bird's-eye field view with fielder position dots.
- Overlay with the batter's spray chart to show alignment/misalignment.
- Shift detection: flag when the defense is in a non-standard alignment.
- Note: Statcast does provide some fielder positioning data, but this feature may require additional sourcing.

#### 3.3.3 "This Reminds Me Of..." — Historical Situation Finder
**Description:** Given the current game state (inning, score, outs, runners, count), find the most similar historical situations and show what happened.

**Requirements:**
- Define a similarity metric across game-state dimensions.
- Surface 3–5 historical parallels with outcomes.
- Fun for storytelling: "In a similar spot in the 2021 NLCS, Freddie Freeman hit a go-ahead double."

#### 3.3.4 Hot/Cold Streak Indicator
**Description:** Show the batter's recent performance trend.

**Requirements:**
- Rolling 7-day and 14-day BA, SLG, wOBA, K%.
- Visual: a sparkline or trend arrow (↑ hot, → neutral, ↓ cold).
- Compare to season average.
- For pitchers: show their last 3–5 starts' game scores or ERA.

---

## 4. Technical Architecture

### 4.1 High-Level Stack

| Layer | Technology | Rationale |
|---|---|---|
| Frontend | React + TypeScript | Component-based, strong ecosystem for data-heavy UIs. |
| Charting / Viz | D3.js (custom viz), Recharts (standard charts) | D3 for strike zones, spray charts, and movement plots. Recharts for line/bar charts (win prob, velocity). |
| State Management | Zustand or React Context | Lightweight. No need for Redux complexity for a personal tool. |
| Polling / Real-Time | `setInterval` + fetch, or WebSocket wrapper | Poll MLB API every 5–10 seconds. Optionally wrap in a WebSocket-like abstraction for cleaner state updates. |
| Data Layer / Backend | Node.js + Express (lightweight API) or serverless functions | Serves precomputed data (hot zones, tendencies), caches MLB API responses, runs nightly batch jobs. |
| Database | SQLite or PostgreSQL | Store precomputed player models, historical matchup data, and Statcast CSVs. SQLite is fine for personal use. |
| Batch Processing | Python scripts (pandas + numpy) | Nightly job to pull Statcast CSVs, compute hot zones, tendency maps, pitch models, and write to the database. |
| Hosting | Self-hosted (local) or a cheap VPS (e.g., DigitalOcean, Fly.io) | Personal tool — no need for enterprise infra. Run locally during development, deploy cheaply when stable. |

### 4.2 Architecture Diagram
*(To be created — see Section 7)*

A simplified flow:

```
[MLB Stats API] --poll (5-10s)--> [Backend / Cache Layer]
                                        |
                                        v
[Baseball Savant CSVs] --nightly--> [Batch Pipeline] --> [Database]
                                                              |
                                                              v
                                    [React Frontend] <--- [API Layer]
                                        |
                                        v
                                  [Browser / Second Screen]
```

### 4.3 Key Technical Decisions

**Why poll instead of WebSocket?**
The MLB API doesn't offer a WebSocket endpoint. Polling every 5–10 seconds is standard practice for live game apps and introduces negligible load for a single user.

**Why precompute hot zones and tendencies?**
Computing heatmaps and tendency maps in real-time from raw pitch data on every at-bat change would be slow and wasteful. Nightly batch processing creates per-player profiles stored in the database. The frontend fetches the relevant profile when the batter or pitcher changes.

**Why a backend at all (vs. purely client-side)?**
Three reasons: (1) MLB API calls are better proxied through a backend to manage rate limits and avoid CORS issues. (2) Precomputed data needs to live somewhere. (3) The prediction model (P1) will need server-side logic unless it's extremely simple.

### 4.4 Data Model (Simplified)

**players**
- `player_id` (MLB ID), `name`, `team`, `position`, `handedness`, `headshot_url`

**pitcher_tendencies**
- `player_id`, `season`, `pitch_type`, `usage_pct`, `avg_velocity`, `avg_h_break`, `avg_v_break`, `zone_distribution` (JSON: zone → frequency)

**batter_hot_zones**
- `player_id`, `season`, `zone_id`, `metric` (wOBA/BA/SLG), `value`, `sample_size`

**batter_vs_pitch_type**
- `player_id`, `season`, `pitch_type`, `pa`, `ba`, `slg`, `woba`, `whiff_pct`, `avg_exit_velo`, `avg_launch_angle`

**batter_spray_chart**
- `player_id`, `season`, `hit_coord_x`, `hit_coord_y`, `exit_velo`, `launch_angle`, `result`, `pitch_type`, `pitcher_hand`, `game_date`

**matchup_history**
- `batter_id`, `pitcher_id`, `game_date`, `at_bat_number`, `pitch_sequence` (JSON), `result`, `exit_velo`, `launch_angle`

**umpire_zones**
- `umpire_id`, `name`, `season`, `zone_accuracy_pct`, `expanded_zone_rate`, `zone_map` (JSON: zone → strike call rate)

**pitcher_game_log** (for fatigue tracking)
- `player_id`, `game_date`, `pitch_number`, `pitch_type`, `velocity`, `spin_rate`, `h_break`, `v_break`, `zone_x`, `zone_z`, `result`

---

## 5. UI/UX Design Principles

### 5.1 Design Philosophy
- **Data-dense but not cluttered.** The user is a power user. Show a lot of information, but use visual hierarchy, color, and progressive disclosure (hover/click for details) to keep it scannable.
- **Dark mode by default.** This is a second-screen app used while watching TV in a dimmed room. Dark backgrounds with high-contrast data.
- **Color consistency.** Pitch types, result types, and hot/cold scales use the same color coding everywhere. Learn it once, read it everywhere.
- **Minimal interaction required.** The app should be largely passive during live play — it updates itself. The user watches the game and glances at the screen. Deep interaction (filtering, historical lookups) is available but not required.

### 5.2 Panel System
- Default layout is curated (see section 3 for priority).
- Panels can be collapsed, reordered, or resized (drag-and-drop grid).
- Panel state is persisted in localStorage between sessions.

### 5.3 Responsive Targets
- Primary: 1920×1080 secondary monitor (two or three column grid).
- Secondary: 1024×768 tablet landscape (two column grid, smaller panels).
- Tertiary: 768px width minimum (single column, scrollable).

---

## 6. Development Phases

### Phase 1 — MVP (P0 features)
**Goal:** Live game sync + core matchup data panels.
**Estimated effort:** 4–6 weeks (nights/weekends pace).
**Deliverables:**
- Game selection screen with today's schedule.
- Live game state bar (score, inning, count, runners, batter/pitcher).
- Strike zone display with live pitch plotting (3.1.1).
- Batter hot zone heatmap (3.1.2).
- Pitcher tendency map (3.1.3).
- Batter vs. pitch type stats table (3.1.4).
- Spray chart (3.1.5).
- Head-to-head matchup history (3.1.6).
- Backend: MLB API proxy, database, nightly batch pipeline.
**Milestone:** Watch a full Braves game with the app running alongside and find it useful.

### Phase 2 — Analytics Upgrade (P1 features)
**Goal:** Prediction, fatigue tracking, and umpire data.
**Estimated effort:** 4–6 weeks.
**Deliverables:**
- Next pitch probability model (3.2.1).
- Win probability graph (3.2.2).
- Pitcher fatigue/velocity tracker (3.2.3).
- Time through the order splits (3.2.4).
- Umpire scouting report (3.2.5).
- Pitch movement visualization (3.2.6).
- Bullpen status panel (3.2.7).
- Batter performance by count (3.2.8).
**Milestone:** Accurately predict 30%+ of pitch types and catch a velocity drop before the broadcast mentions it.

### Phase 3 — Polish & Ambition (P2 features)
**Goal:** Advanced visualizations and historical context.
**Estimated effort:** Ongoing / as-desired.
**Deliverables:** Features from section 3.3, prioritized by interest.
**Milestone:** Spot a historical parallel mid-game before the broadcast mentions it, and catch a pitcher's tunneling pattern that explains a baffling strikeout.

---

## 7. Open Questions & Risks

| # | Question / Risk | Notes |
|---|---|---|
| 1 | **MLB API stability and ToS** | The Stats API is unofficial. It's widely used by open-source projects (e.g., `statsapi` Python package) and MLB has not aggressively blocked it, but there's no SLA. For a personal tool, risk is low. |
| 2 | **Statcast data availability and lag** | Some Statcast metrics (spin rate, exit velo) appear in the live feed; others are only available post-game. Need to map exactly which fields are real-time vs. delayed. |
| 3 | **MLB.TV stream delay sync** | MLB.TV typically runs 30–60 seconds behind the live API feed. The configurable delay offset (2.3) needs testing to feel right. Default is 45 seconds but may vary by device, network conditions, and whether MLB.TV's own delay fluctuates during the game. May need a "sync now" button that lets you tap when you see a pitch on screen to auto-calibrate. |
| 4 | **Prediction model accuracy** | Baseball is inherently unpredictable. A "next pitch" model that's 30–35% accurate on pitch type is actually good. Need to set expectations in the UI so it's fun, not frustrating. |
| 5 | **Nightly data freshness** | If a trade or call-up happens mid-day, the precomputed data won't reflect it until the next nightly run. Acceptable for personal use but worth noting. |
| 6 | **Scope creep** | This PRD already has a lot of features. The phased approach is critical — resist adding P2 features during Phase 1. |

---

## 8. Success Criteria

Since this is a personal tool, success is subjective but measurable:

- **Phase 1 success:** The app is open on the second screen for every Braves game. You find yourself glancing at it multiple times per at-bat and learning things the broadcast doesn't tell you.
- **Phase 2 success:** You notice a pitcher's velocity dropping before the commentators do. You anticipate pitches more accurately. You argue with the umpire's calls with data.
- **Overall success:** Watching baseball is more engaging and informative than ever before. The app feels like a natural extension of the viewing experience rather than a distraction.

---

## Appendix A: Glossary

| Term | Definition |
|---|---|
| **wOBA** | Weighted On-Base Average. A catch-all offensive metric that weights each outcome (walk, single, double, etc.) by its run value. Better than BA or OBP alone. |
| **Whiff%** | Swinging strike rate. Percentage of swings that miss. |
| **Exit Velocity** | Speed of the ball off the bat (mph). Higher = harder contact. |
| **Launch Angle** | Vertical angle of the ball off the bat (degrees). 10–25° is the "sweet spot" for line drives and home runs. |
| **Leverage Index** | A measure of how critical the current game situation is relative to an average situation. 1.0 = average, 2.0+ = high pressure. |
| **Pitch Tunneling** | The concept that two different pitch types can appear identical to the batter until a critical decision point, making both pitches more effective. |
| **Induced Vertical Break (IVB)** | How much a pitch rises or falls relative to a theoretical spinless pitch. High IVB on a fastball = "rising" effect. |
| **Chase Rate** | Percentage of pitches outside the strike zone that a batter swings at. |

---

## Appendix B: Color System (Proposed)

**Pitch Type Colors:**
- 4-Seam Fastball: `#E74C3C` (red)
- Sinker: `#E91E90` (pink)
- Cutter: `#F39C12` (orange)
- Slider: `#3498DB` (blue)
- Curveball: `#F1C40F` (yellow)
- Changeup: `#2ECC71` (green)
- Splitter: `#9B59B6` (purple)

**Hot/Cold Scale:**
- Cold: `#2166AC` (deep blue) → Neutral: `#F7F7F7` (white) → Hot: `#B2182B` (deep red)

**Result Colors (Spray Chart):**
- Out: `#7F8C8D` (gray)
- Single: `#3498DB` (blue)
- Double: `#2ECC71` (green)
- Triple: `#F39C12` (orange)
- Home Run: `#E74C3C` (red)
