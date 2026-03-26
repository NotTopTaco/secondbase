import { useD3Bindable } from '../../hooks/useD3Bindable';
import { computeGridRects } from '../hotZone/hotZoneUtils';
import type { TendencyEntry } from '../../stores/matchupStore';
import { PITCH_COLORS } from '../../theme/colors';
import * as d3 from 'd3';
import styles from './PitcherTendencyCanvas.module.css';

interface PitcherTendencyCanvasProps {
  tendencies: TendencyEntry[];
  selectedPitchType: string | null;
}

export function PitcherTendencyCanvas({
  tendencies,
  selectedPitchType,
}: PitcherTendencyCanvasProps) {
  const filtered = selectedPitchType
    ? tendencies.filter((t) => t.pitchType === selectedPitchType)
    : tendencies;

  const { containerRef } = useD3Bindable(
    (svg, { width, height }) => {
      const sel = d3.select(svg);
      sel.selectAll('*').remove();

      const size = Math.min(width, height);
      sel.attr('width', size).attr('height', size);

      const rects = computeGridRects(size, size);
      const g = sel.append('g');

      // Group tendencies by zone
      const zoneMap = new Map<number, TendencyEntry[]>();
      filtered.forEach((t) => {
        const existing = zoneMap.get(t.zone) ?? [];
        existing.push(t);
        zoneMap.set(t.zone, existing);
      });

      // Find max frequency for normalization
      const maxFreq = Math.max(
        ...filtered.map((t) => t.frequency),
        0.01,
      );

      rects.forEach((r) => {
        // Background cell
        g.append('rect')
          .attr('x', r.x)
          .attr('y', r.y)
          .attr('width', r.width)
          .attr('height', r.height)
          .attr('rx', 3)
          .attr('fill', '#1a1a2a')
          .attr('stroke', '#2a2a3a')
          .attr('stroke-width', 0.5);

        const entries = zoneMap.get(r.zone) ?? [];
        if (entries.length === 0) return;

        if (selectedPitchType) {
          // Single pitch type: fill based on frequency
          const entry = entries[0];
          if (!entry) return;
          const color = PITCH_COLORS[entry.pitchType] ?? '#9898a8';
          const opacity = Math.max(0.1, entry.frequency / maxFreq);
          g.append('rect')
            .attr('x', r.x)
            .attr('y', r.y)
            .attr('width', r.width)
            .attr('height', r.height)
            .attr('rx', 3)
            .attr('fill', color)
            .attr('opacity', opacity);

          g.append('text')
            .attr('x', r.x + r.width / 2)
            .attr('y', r.y + r.height / 2)
            .attr('dy', '0.35em')
            .attr('text-anchor', 'middle')
            .attr('font-size', `${Math.max(10, r.width * 0.2)}px`)
            .attr('font-weight', '600')
            .attr('fill', '#fff')
            .text(`${(entry.frequency * 100).toFixed(0)}%`);
        } else {
          // Multiple pitch types: stacked horizontal bars
          const sorted = [...entries].sort((a, b) => b.frequency - a.frequency);
          let offsetX = 0;
          const totalFreq = sorted.reduce((s, e) => s + e.frequency, 0);

          sorted.forEach((entry) => {
            const barW = totalFreq > 0 ? (entry.frequency / totalFreq) * r.width : 0;
            const color = PITCH_COLORS[entry.pitchType] ?? '#9898a8';
            const opacity = Math.max(0.3, entry.frequency / maxFreq);

            g.append('rect')
              .attr('x', r.x + offsetX)
              .attr('y', r.y)
              .attr('width', barW)
              .attr('height', r.height)
              .attr('fill', color)
              .attr('opacity', opacity);

            offsetX += barW;
          });
        }
      });
    },
    [filtered, selectedPitchType],
  );

  return (
    <div className={styles.container}>
      <svg ref={containerRef} className={styles.svg} />
    </div>
  );
}
