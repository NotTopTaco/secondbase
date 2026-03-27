import { apiFetch } from './client';
import type { HotZoneCell, TendencyEntry, BatterVsPitchRow, SprayChartHit, H2HData } from '../stores/matchupStore';
import type { CountStatRow, TTOSplitRow, PitchMovementPoint } from '../stores/analyticsDataStore';

export interface PlayerInfo {
  id: number;
  fullName: string;
  primaryPosition: { abbreviation: string };
  batSide: { code: string };
  pitchHand: { code: string };
}

export function fetchPlayer(id: number): Promise<PlayerInfo> {
  return apiFetch<PlayerInfo>(`/players/${id}`);
}

export async function fetchHotZones(
  id: number,
  params?: { metric?: string; period?: string },
): Promise<HotZoneCell[]> {
  const search = new URLSearchParams();
  if (params?.period) search.set('period', params.period);
  const qs = search.toString();
  const raw = await apiFetch<Array<{
    zone_id: number; woba: number | null; ba: number | null; slg: number | null; sample_size: number;
  }>>(`/players/${id}/hot-zones${qs ? `?${qs}` : ''}`);
  return raw.map((r) => ({
    zone: r.zone_id,
    woba: r.woba ?? 0,
    ba: r.ba ?? 0,
    slg: r.slg ?? 0,
    sampleSize: r.sample_size,
  }));
}

export async function fetchTendencies(
  id: number,
  params?: { batterHand?: string },
): Promise<TendencyEntry[]> {
  const search = new URLSearchParams();
  if (params?.batterHand) search.set('batterHand', params.batterHand);
  const qs = search.toString();
  const raw = await apiFetch<Array<{
    pitch_type: string; batter_hand: string; usage_pct: number | null;
    avg_velocity: number | null; zone_distribution: string | null;
  }>>(`/players/${id}/pitch-tendencies${qs ? `?${qs}` : ''}`);
  // Expand zone_distribution JSON into individual entries
  const entries: TendencyEntry[] = [];
  for (const r of raw) {
    if (r.zone_distribution) {
      try {
        const dist = JSON.parse(r.zone_distribution) as Record<string, number>;
        for (const [zone, freq] of Object.entries(dist)) {
          entries.push({ pitchType: r.pitch_type, zone: parseInt(zone, 10), frequency: freq / 100, usagePct: r.usage_pct ?? 0, avgVelocity: r.avg_velocity, batterHand: r.batter_hand });
        }
      } catch { /* skip malformed */ }
    }
  }
  return entries;
}

export async function fetchVsPitchType(
  id: number,
  params?: { pitcherHand?: string; season?: number },
): Promise<BatterVsPitchRow[]> {
  const search = new URLSearchParams();
  if (params?.pitcherHand) search.set('hand', params.pitcherHand);
  if (params?.season) search.set('season', String(params.season));
  const qs = search.toString();
  const raw = await apiFetch<Array<{
    pitch_type: string; pa: number; ba: number | null; slg: number | null;
    woba: number | null; whiff_pct: number | null; avg_exit_velo: number | null; avg_launch_angle: number | null;
  }>>(`/players/${id}/vs-pitch-type${qs ? `?${qs}` : ''}`);
  return raw.map((r) => ({
    pitchType: r.pitch_type,
    pa: r.pa,
    ba: r.ba ?? 0,
    slg: r.slg ?? 0,
    wOBA: r.woba ?? 0,
    whiffPct: (r.whiff_pct ?? 0) * 100,
    exitVelo: r.avg_exit_velo ?? 0,
    launchAngle: r.avg_launch_angle ?? 0,
  }));
}

export async function fetchSprayChart(
  id: number,
  params?: { pitchType?: string; pitcherHand?: string },
): Promise<SprayChartHit[]> {
  const search = new URLSearchParams();
  if (params?.pitchType) search.set('pitchType', params.pitchType);
  if (params?.pitcherHand) search.set('hand', params.pitcherHand);
  const qs = search.toString();
  const raw = await apiFetch<Array<{
    hc_x: number | null; hc_y: number | null; exit_velo: number | null;
    launch_angle: number | null; result: string | null; pitch_type: string | null;
    pitcher_hand: string | null; game_date: string | null;
  }>>(`/players/${id}/spray-chart${qs ? `?${qs}` : ''}`);
  return raw
    .filter((r) => r.hc_x != null && r.hc_y != null)
    .map((r) => ({
      coordX: r.hc_x!,
      coordY: r.hc_y!,
      exitVelo: r.exit_velo ?? 0,
      launchAngle: r.launch_angle ?? 0,
      result: r.result ?? 'out',
      pitchType: r.pitch_type ?? '',
      pitcherHand: r.pitcher_hand ?? '',
      date: r.game_date ?? '',
    }));
}

export async function fetchBatterCountStats(
  id: number,
  params?: { season?: number },
): Promise<CountStatRow[]> {
  const search = new URLSearchParams();
  if (params?.season) search.set('season', String(params.season));
  const qs = search.toString();
  const raw = await apiFetch<{ counts: CountStatRow[] }>(
    `/players/${id}/count-stats${qs ? `?${qs}` : ''}`
  );
  return raw.counts;
}

export async function fetchTTOSplits(
  id: number,
  params?: { season?: number },
): Promise<TTOSplitRow[]> {
  const search = new URLSearchParams();
  if (params?.season) search.set('season', String(params.season));
  const qs = search.toString();
  const raw = await apiFetch<{ splits: TTOSplitRow[] }>(
    `/players/${id}/tto-splits${qs ? `?${qs}` : ''}`
  );
  return raw.splits;
}

export async function fetchPitchMovement(
  id: number,
  params?: { season?: number },
): Promise<{ pitcher: PitchMovementPoint[]; leagueAvg: PitchMovementPoint[] }> {
  const search = new URLSearchParams();
  if (params?.season) search.set('season', String(params.season));
  const qs = search.toString();
  return apiFetch(`/players/${id}/pitch-movement${qs ? `?${qs}` : ''}`);
}

export interface StreakWindow {
  window: '7d' | '14d' | 'season';
  ba: number | null;
  slg: number | null;
  woba: number | null;
  kPct: number | null;
  pa: number;
  gamesPlayed: number;
}

export interface BatterDailyStat {
  gameDate: string;
  ba: number | null;
  slg: number | null;
  woba: number | null;
  kPct: number | null;
  pa: number;
}

export interface PitcherRecentStart {
  gameDate: string;
  gameScore: number | null;
  outsRecorded: number;
  k: number;
  hAgainst: number;
  bbAgainst: number;
}

export interface StreakData {
  batter: {
    windows: StreakWindow[];
    dailyStats: BatterDailyStat[];
  };
  pitcher: {
    recentStarts: PitcherRecentStart[];
    seasonAvgGameScore: number | null;
  };
}

export interface TunnelPair {
  pitchTypeA: string;
  pitchTypeB: string;
  tunnelScore: number;
  decisionPointDistanceFt: number;
  separationAtDecisionIn: number;
  separationAtPlateIn: number;
  releaseXA: number;
  releaseZA: number;
  releaseXB: number;
  releaseZB: number;
  velocityA: number;
  velocityB: number;
  pfxXA: number;
  pfxZA: number;
  pfxXB: number;
  pfxZB: number;
  plateXA: number;
  plateZA: number;
  plateXB: number;
  plateZB: number;
  extensionA: number;
  extensionB: number;
  sampleA: number;
  sampleB: number;
}

export interface PitchTunnelingData {
  pairs: TunnelPair[];
  bestPair: TunnelPair | null;
}

export async function fetchPitchTunneling(
  id: number,
  params?: { season?: number },
): Promise<PitchTunnelingData> {
  const search = new URLSearchParams();
  if (params?.season) search.set('season', String(params.season));
  const qs = search.toString();
  return apiFetch<PitchTunnelingData>(`/players/${id}/pitch-tunneling${qs ? `?${qs}` : ''}`);
}

export async function fetchStreak(
  batterId: number,
  pitcherId?: number,
): Promise<StreakData> {
  const search = new URLSearchParams();
  if (pitcherId) search.set('pitcherId', String(pitcherId));
  const qs = search.toString();
  return apiFetch<StreakData>(
    `/players/${batterId}/streak${qs ? `?${qs}` : ''}`
  );
}

// --- Bundle types & fetchers ---

export interface BatterBundleData {
  hotZones: HotZoneCell[];
  batterVsPitch: BatterVsPitchRow[];
  sprayChart: SprayChartHit[];
  h2h: H2HData;
  countStats: CountStatRow[];
  streak: StreakData;
}

export interface PitcherBundleData {
  tendencies: TendencyEntry[];
  ttoSplits: TTOSplitRow[];
  pitchMovement: { pitcher: PitchMovementPoint[]; leagueAvg: PitchMovementPoint[] };
  pitchTunneling: PitchTunnelingData;
}

interface RawBatterBundle {
  hotZones: Array<{ zone_id: number; woba: number | null; ba: number | null; slg: number | null; sample_size: number }>;
  batterVsPitch: Array<{ pitch_type: string; pa: number; ba: number | null; slg: number | null; woba: number | null; whiff_pct: number | null; avg_exit_velo: number | null; avg_launch_angle: number | null }>;
  sprayChart: Array<{ hc_x: number | null; hc_y: number | null; exit_velo: number | null; launch_angle: number | null; result: string | null; pitch_type: string | null; pitcher_hand: string | null; game_date: string | null }>;
  matchup: {
    summary: { batter_id: number; pitcher_id: number; total_pa: number; ba: number | null; slg: number | null; k_pct: number | null; bb_pct: number | null };
    at_bats: Array<{ game_date: string | null; at_bat_number: number; pitch_sequence: string | null; result: string | null; exit_velo: number | null; launch_angle: number | null }>;
  };
  countStats: { counts: CountStatRow[] };
  streak: StreakData;
}

interface RawPitcherBundle {
  tendencies: Array<{ pitch_type: string; batter_hand: string; usage_pct: number | null; avg_velocity: number | null; zone_distribution: string | null }>;
  ttoSplits: { splits: TTOSplitRow[] };
  pitchMovement: { pitcher: PitchMovementPoint[]; leagueAvg: PitchMovementPoint[] };
  pitchTunneling: PitchTunnelingData;
}

export async function fetchBatterBundle(batterId: number, pitcherId: number): Promise<BatterBundleData> {
  const raw = await apiFetch<RawBatterBundle>(`/players/${batterId}/batter-bundle?pitcherId=${pitcherId}`);

  return {
    hotZones: raw.hotZones.map(r => ({
      zone: r.zone_id, woba: r.woba ?? 0, ba: r.ba ?? 0, slg: r.slg ?? 0, sampleSize: r.sample_size,
    })),
    batterVsPitch: raw.batterVsPitch.map(r => ({
      pitchType: r.pitch_type, pa: r.pa, ba: r.ba ?? 0, slg: r.slg ?? 0,
      wOBA: r.woba ?? 0, whiffPct: (r.whiff_pct ?? 0) * 100,
      exitVelo: r.avg_exit_velo ?? 0, launchAngle: r.avg_launch_angle ?? 0,
    })),
    sprayChart: raw.sprayChart
      .filter(r => r.hc_x != null && r.hc_y != null)
      .map(r => ({
        coordX: r.hc_x!, coordY: r.hc_y!, exitVelo: r.exit_velo ?? 0,
        launchAngle: r.launch_angle ?? 0, result: r.result ?? 'out',
        pitchType: r.pitch_type ?? '', pitcherHand: r.pitcher_hand ?? '', date: r.game_date ?? '',
      })),
    h2h: {
      totalPA: raw.matchup.summary.total_pa,
      ba: raw.matchup.summary.ba ?? 0,
      slg: raw.matchup.summary.slg ?? 0,
      kPct: (raw.matchup.summary.k_pct ?? 0) * 100,
      bbPct: (raw.matchup.summary.bb_pct ?? 0) * 100,
      atBats: raw.matchup.at_bats.map(ab => ({
        date: ab.game_date ?? '',
        pitchCount: ab.pitch_sequence ? JSON.parse(ab.pitch_sequence).length : 0,
        pitchSequence: ab.pitch_sequence ? JSON.parse(ab.pitch_sequence).map((p: { pitch_type?: string }) => p.pitch_type ?? '?') : [],
        result: ab.result ?? '',
      })),
    },
    countStats: raw.countStats.counts,
    streak: raw.streak,
  };
}

export async function fetchPitcherBundle(pitcherId: number): Promise<PitcherBundleData> {
  const raw = await apiFetch<RawPitcherBundle>(`/players/${pitcherId}/pitcher-bundle`);

  const tendencies: TendencyEntry[] = [];
  for (const r of raw.tendencies) {
    if (r.zone_distribution) {
      try {
        const dist = JSON.parse(r.zone_distribution) as Record<string, number>;
        for (const [zone, freq] of Object.entries(dist)) {
          tendencies.push({
            pitchType: r.pitch_type, zone: parseInt(zone, 10), frequency: freq / 100,
            usagePct: r.usage_pct ?? 0, avgVelocity: r.avg_velocity, batterHand: r.batter_hand,
          });
        }
      } catch { /* skip malformed */ }
    }
  }

  return {
    tendencies,
    ttoSplits: raw.ttoSplits.splits,
    pitchMovement: raw.pitchMovement,
    pitchTunneling: raw.pitchTunneling,
  };
}
