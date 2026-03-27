import * as d3 from 'd3';
import { useD3Bindable } from '../../hooks/useD3Bindable';
import type { Trend } from './streakUtils';
import styles from './StreakIndicator.module.css';

interface SparklineProps {
  values: (number | null)[];
  baseline: number | null;
  trend: Trend;
}

const TREND_COLORS: Record<Trend, string> = {
  hot: '#2ecc71',
  neutral: '#9898a8',
  cold: '#3498db',
};

export function Sparkline({ values, baseline, trend }: SparklineProps) {
  const { containerRef } = useD3Bindable(
    (svg, { width, height }) => {
      const sel = d3.select(svg);
      sel.selectAll('*').remove();
      sel.attr('width', width).attr('height', height);

      const valid = values
        .map((v, i) => ({ i, v }))
        .filter((d): d is { i: number; v: number } => d.v != null);

      if (valid.length < 2) {
        sel.append('text')
          .attr('x', width / 2)
          .attr('y', height / 2)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .attr('fill', '#9898a8')
          .attr('font-size', 11)
          .text('Insufficient data');
        return;
      }

      const pad = { top: 4, right: 6, bottom: 4, left: 6 };
      const allVals = valid.map((d) => d.v);
      if (baseline != null) allVals.push(baseline);

      const yMin = Math.min(...allVals) - 0.010;
      const yMax = Math.max(...allVals) + 0.010;

      const x = d3.scaleLinear()
        .domain([0, values.length - 1])
        .range([pad.left, width - pad.right]);

      const y = d3.scaleLinear()
        .domain([yMin, yMax])
        .range([height - pad.bottom, pad.top]);

      // Baseline reference line
      if (baseline != null) {
        sel.append('line')
          .attr('x1', pad.left)
          .attr('x2', width - pad.right)
          .attr('y1', y(baseline))
          .attr('y2', y(baseline))
          .attr('stroke', '#9898a8')
          .attr('stroke-width', 1)
          .attr('stroke-dasharray', '3,3')
          .attr('opacity', 0.5);
      }

      // Trend line
      const lineColor = TREND_COLORS[trend];
      const line = d3.line<{ i: number; v: number }>()
        .x((d) => x(d.i))
        .y((d) => y(d.v))
        .curve(d3.curveMonotoneX);

      sel.append('path')
        .datum(valid)
        .attr('d', line)
        .attr('fill', 'none')
        .attr('stroke', lineColor)
        .attr('stroke-width', 1.5)
        .attr('opacity', 0.9);

      // Dot on most recent
      const last = valid[valid.length - 1];
      sel.append('circle')
        .attr('cx', x(last.i))
        .attr('cy', y(last.v))
        .attr('r', 3)
        .attr('fill', lineColor);
    },
    [values, baseline, trend],
  );

  return (
    <div className={styles.sparklineContainer}>
      <svg ref={containerRef} className={styles.sparklineSvg} />
    </div>
  );
}
