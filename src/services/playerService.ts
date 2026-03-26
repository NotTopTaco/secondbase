import { getDb } from '../db/connection.js';
import { fetchPlayer } from '../mlb/mlbClient.js';
import type { Player, HotZone, PitcherTendency, BatterVsPitchType, SprayChartEntry } from '../types/player.js';

let _latestSeason: number | null = null;

function getLatestSeason(): number {
  if (_latestSeason) return _latestSeason;
  const db = getDb();
  const row = db.prepare('SELECT MAX(season) as s FROM batter_hot_zones').get() as { s: number | null } | undefined;
  _latestSeason = row?.s || new Date().getFullYear();
  return _latestSeason;
}

export function getPlayer(playerId: number): Player | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM players WHERE player_id = ?').get(playerId) as Player | undefined;
  return row || null;
}

export async function getPlayerWithFallback(playerId: number): Promise<Player | null> {
  const local = getPlayer(playerId);
  if (local) return local;

  try {
    const data = await fetchPlayer(playerId) as any;
    const person = data.people?.[0];
    if (!person) return null;

    return {
      player_id: person.id,
      full_name: person.fullName,
      team: person.currentTeam?.name || null,
      position: person.primaryPosition?.abbreviation || null,
      bats: person.batSide?.code || null,
      throws: person.pitchHand?.code || null,
      headshot_url: `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/${person.id}/headshot/67/current`,
    };
  } catch {
    return null;
  }
}

export function getHotZones(playerId: number, season?: number, period?: string): HotZone[] {
  const db = getDb();
  const s = season || getLatestSeason();
  const p = period || 'season';
  return db.prepare(
    'SELECT * FROM batter_hot_zones WHERE player_id = ? AND season = ? AND period = ?'
  ).all(playerId, s, p) as HotZone[];
}

export function getPitcherTendencies(playerId: number, season?: number, batterHand?: string): PitcherTendency[] {
  const db = getDb();
  const s = season || getLatestSeason();

  if (batterHand) {
    return db.prepare(
      'SELECT * FROM pitcher_tendencies WHERE player_id = ? AND season = ? AND batter_hand = ?'
    ).all(playerId, s, batterHand) as PitcherTendency[];
  }

  return db.prepare(
    'SELECT * FROM pitcher_tendencies WHERE player_id = ? AND season = ?'
  ).all(playerId, s) as PitcherTendency[];
}

export function getBatterVsPitchType(playerId: number, season?: number, pitcherHand?: string): BatterVsPitchType[] {
  const db = getDb();
  const s = season || getLatestSeason();

  if (pitcherHand) {
    return db.prepare(
      'SELECT * FROM batter_vs_pitch_type WHERE player_id = ? AND season = ? AND pitcher_hand = ?'
    ).all(playerId, s, pitcherHand) as BatterVsPitchType[];
  }

  return db.prepare(
    'SELECT * FROM batter_vs_pitch_type WHERE player_id = ? AND season = ?'
  ).all(playerId, s) as BatterVsPitchType[];
}

export function getSprayChart(playerId: number, season?: number, pitchType?: string, pitcherHand?: string): SprayChartEntry[] {
  const db = getDb();
  const s = season || getLatestSeason();

  let sql = 'SELECT * FROM batter_spray_chart WHERE player_id = ? AND season = ?';
  const params: (number | string)[] = [playerId, s];

  if (pitchType) {
    sql += ' AND pitch_type = ?';
    params.push(pitchType);
  }
  if (pitcherHand) {
    sql += ' AND pitcher_hand = ?';
    params.push(pitcherHand);
  }

  return db.prepare(sql).all(...params) as SprayChartEntry[];
}
