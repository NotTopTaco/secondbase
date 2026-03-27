import { fetchBoxscore } from '../mlb/mlbClient.js';
import { getLiveFeed } from './gameService.js';
import { getDb } from '../db/connection.js';
import { getLatestSeasonFor } from './seasonCache.js';
import { cacheGet, cacheSet } from '../cache/cache.js';
import type { DefensivePositioningResponse, FielderPosition, DefensiveAlignmentSummary } from '../types/defensivePositioning.js';
import type { MlbBoxscore, MlbBoxscorePlayer } from '../mlb/mlbTypes.js';

// Standard defensive positions in SVG space (250x250 viewBox, home at 125, 220)
const STANDARD_POSITIONS: Record<string, { x: number; y: number }> = {
  P:   { x: 125, y: 195 },
  C:   { x: 125, y: 228 },
  '1B': { x: 152, y: 190 },
  '2B': { x: 137, y: 175 },
  SS:  { x: 113, y: 175 },
  '3B': { x: 98, y: 190 },
  LF:  { x: 72, y: 115 },
  CF:  { x: 125, y: 90 },
  RF:  { x: 178, y: 115 },
};

const POSITION_ALIASES: Record<string, string> = {
  'Pitcher': 'P', 'Catcher': 'C',
  'First Base': '1B', 'Second Base': '2B', 'Third Base': '3B', 'Shortstop': 'SS',
  'Left Field': 'LF', 'Center Field': 'CF', 'Right Field': 'RF',
};

function getLatestSeason(): number {
  return getLatestSeasonFor('batter_defensive_alignment');
}

function getAlignment(batterId: number, season?: number): DefensiveAlignmentSummary | null {
  const db = getDb();
  const s = season || getLatestSeason();

  const row = db.prepare(
    'SELECT * FROM batter_defensive_alignment WHERE player_id = ? AND season = ?'
  ).get(batterId, s) as {
    if_standard_pct: number | null;
    if_shade_pct: number | null;
    if_strategic_pct: number | null;
    of_standard_pct: number | null;
    of_strategic_pct: number | null;
    total_pa: number;
    pull_pct: number | null;
    center_pct: number | null;
    oppo_pct: number | null;
  } | undefined;

  if (!row) return null;

  return {
    ifStandardPct: row.if_standard_pct,
    ifShadePct: row.if_shade_pct,
    ifStrategicPct: row.if_strategic_pct,
    ofStandardPct: row.of_standard_pct,
    ofStrategicPct: row.of_strategic_pct,
    totalPA: row.total_pa,
    pullPct: row.pull_pct,
    centerPct: row.center_pct,
    oppoPct: row.oppo_pct,
  };
}

export async function getDefensivePositioning(
  gamePk: number,
  batterId: number,
): Promise<DefensivePositioningResponse> {
  const cacheKey = `defpos:${gamePk}`;
  const cached = cacheGet<DefensivePositioningResponse>(cacheKey);
  if (cached && cached.alignment) return cached;

  // Get live feed to determine which team is fielding
  const feed = await getLiveFeed(gamePk) as {
    liveData?: {
      linescore?: {
        inningHalf?: string;
        defense?: Record<string, unknown>;
      };
    };
  };

  const inningHalf = feed?.liveData?.linescore?.inningHalf ?? 'Top';
  const isTop = inningHalf.toLowerCase().includes('top');

  // Fetch boxscore for defensive lineup
  let fielders: FielderPosition[] = [];
  try {
    const boxscore: MlbBoxscore = await fetchBoxscore(gamePk);
    // When it's the top half, home team is fielding; bottom = away
    const fieldingTeam = isTop ? boxscore.teams?.home : boxscore.teams?.away;
    const players = fieldingTeam?.players ?? {};

    const seen = new Set<string>();
    for (const [_key, player] of Object.entries(players) as Array<[string, MlbBoxscorePlayer]>) {
      const pos = player.position?.abbreviation;
      if (!pos || !STANDARD_POSITIONS[pos] || seen.has(pos)) continue;
      seen.add(pos);

      const coords = STANDARD_POSITIONS[pos];
      fielders.push({
        position: pos,
        playerId: player.person?.id ?? 0,
        playerName: player.person?.fullName ?? '',
        svgX: coords.x,
        svgY: coords.y,
      });
    }
  } catch {
    // Boxscore not available; return standard positions without names
    fielders = Object.entries(STANDARD_POSITIONS).map(([pos, coords]) => ({
      position: pos,
      playerId: 0,
      playerName: '',
      svgX: coords.x,
      svgY: coords.y,
    }));
  }

  // Get historical alignment data for this batter
  const alignment = getAlignment(batterId);

  // Detect shift
  let shiftDetected = false;
  let shiftDescription: string | null = null;
  if (alignment) {
    const nonStandardPct = (alignment.ifShadePct ?? 0) + (alignment.ifStrategicPct ?? 0);
    if (nonStandardPct > 50) {
      shiftDetected = true;
      if ((alignment.ifShadePct ?? 0) > (alignment.ifStrategicPct ?? 0)) {
        shiftDescription = `Infield shade (${Math.round(alignment.ifShadePct ?? 0)}% of PAs)`;
      } else {
        shiftDescription = `Strategic alignment (${Math.round(alignment.ifStrategicPct ?? 0)}% of PAs)`;
      }
    }
  }

  const result: DefensivePositioningResponse = {
    fielders,
    alignment,
    shiftDetected,
    shiftDescription,
  };

  cacheSet(cacheKey, result, 30);
  return result;
}
