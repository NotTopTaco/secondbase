import { useD3Bindable } from '../../hooks/useD3Bindable';
import {
  computeGridRects,
  createDivergingScale,
  formatMetricValue,
  normalizeValue,
} from './hotZoneUtils';
import type { HotZoneCell } from '../../stores/matchupStore';
import * as d3 from 'd3';
import styles from './HotZoneCanvas.module.css';

interface HotZoneCanvasProps {
  zones: HotZoneCell[];
  metric: string;
}

export function HotZoneCanvas({ zones, metric }: HotZoneCanvasProps) {
  const { containerRef } = useD3Bindable(
    (svg, { width, height }) => {
      const sel = d3.select(svg);
      sel.selectAll('*').remove();

      const size = Math.min(width, height);
      sel.attr('width', size).attr('height', size);

      // SVG defs for glow filter
      const defs = sel.append('defs');
      const glowFilter = defs.append('filter').attr('id', 'hotGlow');
      glowFilter.append('feGaussianBlur').attr('in', 'SourceGraphic').attr('stdDeviation', '2').attr('result', 'blur');
      const glowMerge = glowFilter.append('feMerge');
      glowMerge.append('feMergeNode').attr('in', 'blur');
      glowMerge.append('feMergeNode').attr('in', 'SourceGraphic');

      const colorScale = createDivergingScale();
      const rects = computeGridRects(size, size);

      const metricKey = metric === 'BA' ? 'ba' : metric === 'SLG' ? 'slg' : 'woba';
      const zoneMap = new Map(zones.map((z) => [z.zone, z[metricKey as keyof typeof z] as number ?? 0]));

      const g = sel.append('g');

      rects.forEach((r) => {
        const value = zoneMap.get(r.zone) ?? 0;
        const norm = normalizeValue(value, metric);

        const cell = g.append('rect')
          .attr('x', r.x)
          .attr('y', r.y)
          .attr('width', r.width)
          .attr('height', r.height)
          .attr('rx', 6)
          .attr('fill', colorScale(norm));

        // Glow and stroke for hot cells
        if (norm > 0.65) {
          cell.attr('filter', 'url(#hotGlow)');
          cell.attr('stroke', 'rgba(178, 24, 43, 0.4)').attr('stroke-width', 1);
        } else if (norm < 0.35) {
          cell.attr('stroke', 'rgba(33, 102, 172, 0.3)').attr('stroke-width', 0.5);
        }

        g.append('text')
          .attr('x', r.x + r.width / 2)
          .attr('y', r.y + r.height / 2)
          .attr('dy', '0.35em')
          .attr('text-anchor', 'middle')
          .attr('font-size', `${Math.max(10, r.width * 0.22)}px`)
          .attr('font-weight', '600')
          .attr('fill', norm > 0.3 && norm < 0.7 ? '#333' : '#fff')
          .text(formatMetricValue(value, metric));
      });
    },
    [zones, metric],
  );

  return (
    <div className={styles.container}>
      <svg ref={containerRef} className={styles.svg} />
    </div>
  );
}
