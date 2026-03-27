import { Panel } from '../../components/ui/Panel';
import { usePanelStore } from '../../stores/panelStore';
import { useGameStore } from '../../stores/gameStore';
import { useGameAnalyticsStore } from '../../stores/gameAnalyticsStore';
import { useMatchupStore } from '../../stores/matchupStore';
import { VelocityChart } from './VelocityChart';
import { FatigueAlert } from './FatigueAlert';
import { VelocitySummary } from './VelocitySummary';
import { useMemo } from 'react';

const PANEL_ID = 'pitcherFatigue';

export function PitcherFatiguePanel() {
  const panel = usePanelStore((s) => s.panels.find((p) => p.id === PANEL_ID));
  const toggleCollapse = usePanelStore((s) => s.toggleCollapse);
  const pitcher = useGameStore((s) => s.pitcher);
  const pitches = useGameAnalyticsStore((s) => s.currentPitcherAllPitches);
  const tendencies = useMatchupStore((s) => s.tendencies);

  const seasonAverages = useMemo(() => {
    const avgs: Record<string, number> = {};
    for (const t of tendencies) {
      if (!avgs[t.pitchType]) {
        avgs[t.pitchType] = 0;
      }
    }
    // Compute season averages from tendency usage-weighted data
    // Fall back to first-inning averages from game data when tendencies
    // don't carry velocity info
    if (pitches.length > 0) {
      const firstInningPitches = pitches.filter((p) => p.inning <= 1);
      const byType = new Map<string, number[]>();
      for (const p of firstInningPitches.length > 0 ? firstInningPitches : pitches.slice(0, 15)) {
        const arr = byType.get(p.pitchType) ?? [];
        arr.push(p.velocity);
        byType.set(p.pitchType, arr);
      }
      for (const [type, velos] of byType) {
        avgs[type] = velos.reduce((s, v) => s + v, 0) / velos.length;
      }
    }
    return avgs;
  }, [tendencies, pitches]);

  if (!panel) return null;

  return (
    <Panel
      id={PANEL_ID}
      title={panel.title}
      collapsed={panel.collapsed}
      onToggleCollapse={() => toggleCollapse(PANEL_ID)}
      players={pitcher ? [{ id: pitcher.id, name: pitcher.name }] : []}
      sortable
    >
      <FatigueAlert pitches={pitches} seasonAverages={seasonAverages} />
      <VelocityChart pitches={pitches} />
      <VelocitySummary pitches={pitches} seasonAverages={seasonAverages} />
    </Panel>
  );
}
