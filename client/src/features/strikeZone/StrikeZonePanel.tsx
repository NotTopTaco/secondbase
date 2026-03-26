import { useGameStore } from '../../stores/gameStore';
import { Panel } from '../../components/ui/Panel';
import { usePanelStore } from '../../stores/panelStore';
import { StrikeZoneCanvas } from './StrikeZoneCanvas';
import { PitchLegend } from './PitchLegend';

const PANEL_ID = 'strikeZone';

export function StrikeZonePanel() {
  const pitches = useGameStore((s) => s.pitches);
  const panel = usePanelStore((s) => s.panels.find((p) => p.id === PANEL_ID));
  const toggleCollapse = usePanelStore((s) => s.toggleCollapse);

  if (!panel) return null;

  return (
    <Panel
      id={PANEL_ID}
      title={panel.title}
      collapsed={panel.collapsed}
      onToggleCollapse={() => toggleCollapse(PANEL_ID)}
      sortable
    >
      <StrikeZoneCanvas pitches={pitches} />
      <PitchLegend />
    </Panel>
  );
}
