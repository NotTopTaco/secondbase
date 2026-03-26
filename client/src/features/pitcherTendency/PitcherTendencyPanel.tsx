import { useState, useMemo } from 'react';
import { Panel } from '../../components/ui/Panel';
import { FilterBar } from '../../components/ui/FilterBar';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { Toggle } from '../../components/ui/Toggle';
import { Spinner } from '../../components/ui/Spinner';
import { usePanelStore } from '../../stores/panelStore';
import { useMatchupStore } from '../../stores/matchupStore';
import { PITCH_LABELS } from '../../theme/colors';
import { PitcherTendencyCanvas } from './PitcherTendencyCanvas';
import { UsageAnnotation } from './UsageAnnotation';

const PANEL_ID = 'pitcherTendency';

export function PitcherTendencyPanel() {
  const [selectedPitch, setSelectedPitch] = useState<string | null>(null);
  const [vsLeft, setVsLeft] = useState(false);
  const panel = usePanelStore((s) => s.panels.find((p) => p.id === PANEL_ID));
  const toggleCollapse = usePanelStore((s) => s.toggleCollapse);
  const tendencies = useMatchupStore((s) => s.tendencies);
  const loading = useMatchupStore((s) => s.loadingTendencies);

  // Determine available pitch types from tendencies
  const pitchTypes = useMemo(() => {
    const types = new Set(tendencies.map((t) => t.pitchType));
    return Array.from(types);
  }, [tendencies]);

  const pitchOptions = useMemo(() => {
    return [
      { value: 'all', label: 'All' },
      ...pitchTypes.map((pt) => ({
        value: pt,
        label: PITCH_LABELS[pt] ?? pt,
      })),
    ];
  }, [pitchTypes]);

  // Compute usage percentages from usagePct (deduplicate by pitch type)
  const usage = useMemo(() => {
    const seen = new Map<string, number>();
    tendencies.forEach((t) => {
      if (!seen.has(t.pitchType)) {
        seen.set(t.pitchType, t.usagePct);
      }
    });
    return Array.from(seen.entries()).map(([pitchType, percentage]) => ({
      pitchType,
      percentage,
    }));
  }, [tendencies]);

  if (!panel) return null;

  return (
    <Panel
      id={PANEL_ID}
      title={panel.title}
      collapsed={panel.collapsed}
      onToggleCollapse={() => toggleCollapse(PANEL_ID)}
      sortable
    >
      <FilterBar>
        <SegmentedControl
          options={pitchOptions}
          value={selectedPitch ?? 'all'}
          onChange={(v) => setSelectedPitch(v === 'all' ? null : v)}
        />
        <Toggle
          checked={vsLeft}
          onChange={setVsLeft}
          label="vs LHB"
        />
      </FilterBar>
      {loading ? (
        <Spinner />
      ) : (
        <>
          <PitcherTendencyCanvas
            tendencies={tendencies}
            selectedPitchType={selectedPitch}
          />
          <UsageAnnotation items={usage} />
        </>
      )}
    </Panel>
  );
}
