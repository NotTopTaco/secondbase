import { useState, useMemo } from 'react';
import { Panel } from '../../components/ui/Panel';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { Spinner } from '../../components/ui/Spinner';
import { usePanelStore } from '../../stores/panelStore';
import { useGameStore } from '../../stores/gameStore';
import { useMatchupStore, type TendencyEntry } from '../../stores/matchupStore';
import { PITCH_COLORS, PITCH_LABELS } from '../../theme/colors';
import { ZoneGrid } from './ZoneGrid';
import styles from './PitcherTendencyPanel.module.css';

const PANEL_ID = 'pitcherTendency';

interface ArsenalRow {
  pitchType: string;
  usagePct: number;
  avgVelocity: number | null;
}

function buildArsenal(tendencies: TendencyEntry[], hand: string | null): ArsenalRow[] {
  const map = new Map<string, { usagePct: number; avgVelocity: number | null }>();
  for (const t of tendencies) {
    if (hand && t.batterHand !== hand) continue;
    if (!map.has(t.pitchType)) {
      map.set(t.pitchType, { usagePct: t.usagePct, avgVelocity: t.avgVelocity });
    }
  }
  return Array.from(map.entries())
    .map(([pitchType, data]) => ({ pitchType, ...data }))
    .sort((a, b) => b.usagePct - a.usagePct);
}

function getZoneData(tendencies: TendencyEntry[], pitchType: string, hand: string | null): Map<number, number> {
  const zones = new Map<number, number>();
  for (const t of tendencies) {
    if (t.pitchType !== pitchType) continue;
    if (hand && t.batterHand !== hand) continue;
    zones.set(t.zone, (zones.get(t.zone) ?? 0) + t.frequency);
  }
  // If we summed across both hands, average them
  if (!hand) {
    for (const [z, v] of zones) {
      zones.set(z, v / 2);
    }
  }
  return zones;
}

export function PitcherTendencyPanel() {
  const [selectedPitch, setSelectedPitch] = useState<string | null>(null);
  const [handFilter, setHandFilter] = useState<string>('all');
  const panel = usePanelStore((s) => s.panels.find((p) => p.id === PANEL_ID));
  const toggleCollapse = usePanelStore((s) => s.toggleCollapse);
  const pitcher = useGameStore((s) => s.pitcher);
  const tendencies = useMatchupStore((s) => s.tendencies);
  const loading = useMatchupStore((s) => s.loadingTendencies);

  const hand = handFilter === 'all' ? null : handFilter;

  const arsenal = useMemo(() => buildArsenal(tendencies, hand), [tendencies, hand]);

  // Auto-select first pitch type if none selected or selected no longer exists
  const activePitch = useMemo(() => {
    if (selectedPitch && arsenal.some((a) => a.pitchType === selectedPitch)) return selectedPitch;
    return arsenal[0]?.pitchType ?? null;
  }, [selectedPitch, arsenal]);

  const zoneData = useMemo(() => {
    if (!activePitch) return new Map<number, number>();
    return getZoneData(tendencies, activePitch, hand);
  }, [tendencies, activePitch, hand]);

  const maxUsage = arsenal.length > 0 ? arsenal[0].usagePct : 1;

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
      {loading ? (
        <Spinner />
      ) : (
        <div className={styles.layout}>
          <div className={styles.controls}>
            <SegmentedControl
              options={[
                { value: 'all', label: 'All' },
                { value: 'R', label: 'vs RHB' },
                { value: 'L', label: 'vs LHB' },
              ]}
              value={handFilter}
              onChange={setHandFilter}
            />
          </div>

          <div className={styles.arsenalTable}>
            {arsenal.map((row) => {
              const color = PITCH_COLORS[row.pitchType] ?? '#888';
              const label = PITCH_LABELS[row.pitchType] ?? row.pitchType;
              const isActive = row.pitchType === activePitch;
              return (
                <button
                  key={row.pitchType}
                  className={`${styles.arsenalRow} ${isActive ? styles.activeRow : ''}`}
                  onClick={() => setSelectedPitch(row.pitchType)}
                  type="button"
                  style={{ '--pitch-color': color } as React.CSSProperties}
                >
                  <span className={styles.pitchDot} style={{ background: color }} />
                  <span className={styles.pitchName}>{label}</span>
                  <div className={styles.usageBarTrack}>
                    <div
                      className={styles.usageBarFill}
                      style={{ width: `${(row.usagePct / maxUsage) * 100}%`, background: color }}
                    />
                  </div>
                  <span className={styles.usagePct}>{row.usagePct.toFixed(1)}%</span>
                  {row.avgVelocity != null && (
                    <span className={styles.velocity}>{row.avgVelocity.toFixed(1)}</span>
                  )}
                </button>
              );
            })}
          </div>

          {activePitch && (
            <div className={styles.zoneSection}>
              <div className={styles.zoneSectionHeader}>
                <span className={styles.pitchDot} style={{ background: PITCH_COLORS[activePitch] ?? '#888' }} />
                <span className={styles.zoneLabel}>
                  {PITCH_LABELS[activePitch] ?? activePitch} Location
                </span>
              </div>
              <ZoneGrid
                zones={zoneData}
                color={PITCH_COLORS[activePitch] ?? '#888'}
              />
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}
