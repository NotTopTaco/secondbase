import { useMemo } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { Panel } from '../../components/ui/Panel';
import { usePanelStore } from '../../stores/panelStore';
import { useUmpireStore } from '../../stores/umpireStore';
import { usePredictionStore } from '../../stores/predictionStore';
import { StrikeZoneCanvas } from './StrikeZoneCanvas';
import { PitchLegend } from './PitchLegend';
import { createUmpireOverlay } from '../umpireScouting/UmpireZoneOverlay';
import { createPredictionOverlay } from '../nextPitchProbability/LocationOverlay';
import type { OverlayFn } from './useStrikeZone';

const PANEL_ID = 'strikeZone';

export function StrikeZonePanel() {
  const pitches = useGameStore((s) => s.pitches);
  const panel = usePanelStore((s) => s.panels.find((p) => p.id === PANEL_ID));
  const toggleCollapse = usePanelStore((s) => s.toggleCollapse);

  const showUmpireOverlay = useUmpireStore((s) => s.showOverlay);
  const umpireZones = useUmpireStore((s) => s.zones);
  const showPredictionOverlay = usePredictionStore((s) => s.showLocationOverlay);
  const predictions = usePredictionStore((s) => s.predictions);

  const overlays = useMemo(() => {
    const fns: OverlayFn[] = [];
    if (showUmpireOverlay && umpireZones.length > 0) {
      fns.push(createUmpireOverlay(umpireZones));
    }
    if (showPredictionOverlay && predictions.length > 0 && predictions[0].zoneDistribution) {
      fns.push(createPredictionOverlay(predictions[0].zoneDistribution));
    }
    return fns;
  }, [showUmpireOverlay, umpireZones, showPredictionOverlay, predictions]);

  if (!panel) return null;

  return (
    <Panel
      id={PANEL_ID}
      title={panel.title}
      collapsed={panel.collapsed}
      onToggleCollapse={() => toggleCollapse(PANEL_ID)}
      sortable
    >
      <StrikeZoneCanvas pitches={pitches} overlays={overlays} />
      <PitchLegend />
    </Panel>
  );
}
