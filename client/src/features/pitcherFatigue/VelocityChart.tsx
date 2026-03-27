import * as d3 from 'd3';
import { useD3Bindable } from '../../hooks/useD3Bindable';
import { PITCH_COLORS, PITCH_LABELS } from '../../theme/colors';
import type { PitcherPitch } from '../../stores/gameAnalyticsStore';
import styles from './VelocityChart.module.css';

interface VelocityChartProps {
  pitches: PitcherPitch[];
}

export function VelocityChart({ pitches }: VelocityChartProps) {
  const { containerRef } = useD3Bindable(
    (svg, { width, height }) => {
      const sel = d3.select(svg);
      sel.selectAll('*').remove();
      sel.attr('width', width).attr('height', height);

      if (pitches.length === 0) {
        sel
          .append('text')
          .attr('x', width / 2)
          .attr('y', height / 2)
          .attr('text-anchor', 'middle')
          .attr('fill', '#8888a0')
          .attr('font-size', '13px')
          .text('No pitch data yet');
        return;
      }

      const margin = { top: 20, right: 60, bottom: 30, left: 40 };
      const innerW = width - margin.left - margin.right;
      const innerH = height - margin.top - margin.bottom;

      const g = sel.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

      // Group pitches by pitch type
      const byType = d3.group(pitches, (d) => d.pitchType);

      // Scales
      const xExtent = d3.extent(pitches, (d) => d.pitchNumber) as [number, number];
      const x = d3.scaleLinear().domain(xExtent).range([0, innerW]);

      const veloExtent = d3.extent(pitches, (d) => d.velocity) as [number, number];
      const padding = (veloExtent[1] - veloExtent[0]) * 0.1 || 2;
      const y = d3
        .scaleLinear()
        .domain([veloExtent[0] - padding, veloExtent[1] + padding])
        .range([innerH, 0]);

      // X axis
      g.append('g')
        .attr('transform', `translate(0,${innerH})`)
        .call(
          d3
            .axisBottom(x)
            .ticks(Math.min(pitches.length, 10))
            .tickFormat(d3.format('d')),
        )
        .call((axis) => {
          axis.select('.domain').attr('stroke', '#3a3a4a');
          axis.selectAll('.tick line').attr('stroke', '#3a3a4a');
          axis.selectAll('.tick text').attr('fill', '#9898a8').attr('font-size', '10px');
        });

      // X axis label
      g.append('text')
        .attr('x', innerW / 2)
        .attr('y', innerH + margin.bottom - 4)
        .attr('text-anchor', 'middle')
        .attr('fill', '#7878a0')
        .attr('font-size', '10px')
        .text('Pitch #');

      // Y axis
      g.append('g')
        .call(d3.axisLeft(y).ticks(5).tickFormat((d) => `${d}`))
        .call((axis) => {
          axis.select('.domain').attr('stroke', '#3a3a4a');
          axis.selectAll('.tick line').attr('stroke', '#3a3a4a');
          axis.selectAll('.tick text').attr('fill', '#9898a8').attr('font-size', '10px');
        });

      // Y axis label
      g.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -innerH / 2)
        .attr('y', -margin.left + 12)
        .attr('text-anchor', 'middle')
        .attr('fill', '#7878a0')
        .attr('font-size', '10px')
        .text('mph');

      // Line generator
      const line = d3
        .line<PitcherPitch>()
        .x((d) => x(d.pitchNumber))
        .y((d) => y(d.velocity))
        .curve(d3.curveMonotoneX);

      // Draw a line and dots for each pitch type
      for (const [type, typePitches] of byType) {
        const color = PITCH_COLORS[type] ?? '#9898a8';
        const sorted = [...typePitches].sort((a, b) => a.pitchNumber - b.pitchNumber);

        // Line
        g.append('path')
          .datum(sorted)
          .attr('d', line)
          .attr('fill', 'none')
          .attr('stroke', color)
          .attr('stroke-width', 2)
          .attr('stroke-opacity', 0.8);

        // Dots
        g.selectAll(`.dot-${type}`)
          .data(sorted)
          .join('circle')
          .attr('cx', (d) => x(d.pitchNumber))
          .attr('cy', (d) => y(d.velocity))
          .attr('r', 3)
          .attr('fill', color)
          .attr('stroke', '#0e0e18')
          .attr('stroke-width', 1);
      }

      // Legend on the right side
      const legendEntries = Array.from(byType.keys());
      const legendG = sel
        .append('g')
        .attr('transform', `translate(${width - margin.right + 8}, ${margin.top})`);

      legendEntries.forEach((type, i) => {
        const color = PITCH_COLORS[type] ?? '#9898a8';
        const label = PITCH_LABELS[type] ?? type;
        const yPos = i * 16;

        legendG
          .append('rect')
          .attr('x', 0)
          .attr('y', yPos)
          .attr('width', 10)
          .attr('height', 10)
          .attr('rx', 2)
          .attr('fill', color);

        legendG
          .append('text')
          .attr('x', 14)
          .attr('y', yPos + 9)
          .attr('fill', '#c0c0d0')
          .attr('font-size', '9px')
          .text(label);
      });
    },
    [pitches],
  );

  return (
    <div className={styles.container}>
      <svg ref={containerRef} className={styles.svg} />
    </div>
  );
}
