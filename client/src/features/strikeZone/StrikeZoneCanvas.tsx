import { useState } from 'react';
import type { PitchEvent } from '../../stores/gameStore';
import { useStrikeZone, type OverlayFn } from './useStrikeZone';
import { Tooltip } from '../../components/ui/Tooltip';
import { PITCH_COLORS, PITCH_LABELS } from '../../theme/colors';
import styles from './StrikeZoneCanvas.module.css';

interface StrikeZoneCanvasProps {
  pitches: PitchEvent[];
  overlays?: OverlayFn[];
}

interface TooltipState {
  x: number;
  y: number;
  pitch: PitchEvent;
}

export function StrikeZoneCanvas({ pitches, overlays }: StrikeZoneCanvasProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const { containerRef } = useStrikeZone({
    pitches,
    onTooltip: setTooltip,
    overlays,
  });

  return (
    <div className={styles.container}>
      <svg ref={containerRef} className={styles.svg} />
      <Tooltip
        visible={tooltip !== null}
        x={tooltip?.x ?? 0}
        y={tooltip?.y ?? 0}
      >
        {tooltip && (
          <div>
            <div style={{ fontWeight: 600, marginBottom: 2 }}>
              <span
                style={{
                  display: 'inline-block',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: PITCH_COLORS[tooltip.pitch.type] ?? '#9898a8',
                  marginRight: 4,
                }}
              />
              {PITCH_LABELS[tooltip.pitch.type] ?? tooltip.pitch.typeDescription}
            </div>
            <div>Velocity: {(tooltip.pitch.speed ?? 0).toFixed(1)} mph</div>
            {(tooltip.pitch.spinRate ?? 0) > 0 && (
              <div>Spin: {(tooltip.pitch.spinRate ?? 0).toFixed(0)} rpm</div>
            )}
            <div>
              Break: {(tooltip.pitch.breakH ?? 0).toFixed(1)}&quot;H / {(tooltip.pitch.breakV ?? 0).toFixed(1)}&quot;V
            </div>
            <div>Result: {tooltip.pitch.callDescription}</div>
          </div>
        )}
      </Tooltip>
    </div>
  );
}
