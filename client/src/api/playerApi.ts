import { apiFetch } from './client';
import type { HotZoneCell, TendencyEntry, BatterVsPitchRow, SprayChartHit } from '../stores/matchupStore';

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
          entries.push({ pitchType: r.pitch_type, zone: parseInt(zone, 10), frequency: freq / 100, usagePct: r.usage_pct ?? 0 });
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
