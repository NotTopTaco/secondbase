import * as d3 from 'd3';
import { useD3Bindable } from '../../hooks/useD3Bindable';
import { PITCH_COLORS, PITCH_LABELS } from '../../theme/colors';
import type { PitchMovementPoint } from '../../stores/analyticsDataStore';
import styles from './MovementChart.module.css';

interface MovementChartProps {
  pitcher: PitchMovementPoint[];
  leagueAvg: PitchMovementPoint[];
}

export function MovementChart({ pitcher, leagueAvg }: MovementChartProps) {
  const { containerRef } = useD3Bindable(
    (svg, { width, height }) => {
      const sel = d3.select(svg);
      sel.selectAll('*').remove();
      sel.attr('width', width).attr('height', height);

      if (pitcher.length === 0) {
        sel
          .append('text')
          .attr('x', width / 2)
          .attr('y', height / 2)
          .attr('text-anchor', 'middle')
          .attr('fill', '#8888a0')
          .attr('font-size', '13px')
          .text('No movement data yet');
        return;
      }

      const margin = { top: 20, right: 80, bottom: 40, left: 50 };
      const innerW = width - margin.left - margin.right;
      const innerH = height - margin.top - margin.bottom;

      const g = sel.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

      // Combine pitcher and league data for domain calculation
      const allPoints = [...pitcher, ...leagueAvg];
      const hExtent = d3.extent(allPoints, (d) => d.hBreak) as [number, number];
      const vExtent = d3.extent(allPoints, (d) => d.vBreak) as [number, number];

      // Add padding around extents
      const hPad = ((hExtent[1] - hExtent[0]) * 0.15) || 3;
      const vPad = ((vExtent[1] - vExtent[0]) * 0.15) || 3;

      const x = d3
        .scaleLinear()
        .domain([hExtent[0] - hPad, hExtent[1] + hPad])
        .range([0, innerW]);

      const y = d3
        .scaleLinear()
        .domain([vExtent[0] - vPad, vExtent[1] + vPad])
        .range([innerH, 0]);

      // Grid lines
      g.append('g')
        .attr('class', 'grid-x')
        .selectAll('line')
        .data(x.ticks(8))
        .join('line')
        .attr('x1', (d) => x(d))
        .attr('x2', (d) => x(d))
        .attr('y1', 0)
        .attr('y2', innerH)
        .attr('stroke', '#1e2d42')
        .attr('stroke-dasharray', '2,3');

      g.append('g')
        .attr('class', 'grid-y')
        .selectAll('line')
        .data(y.ticks(8))
        .join('line')
        .attr('x1', 0)
        .attr('x2', innerW)
        .attr('y1', (d) => y(d))
        .attr('y2', (d) => y(d))
        .attr('stroke', '#1e2d42')
        .attr('stroke-dasharray', '2,3');

      // Zero reference lines
      if (x.domain()[0] < 0 && x.domain()[1] > 0) {
        g.append('line')
          .attr('x1', x(0))
          .attr('x2', x(0))
          .attr('y1', 0)
          .attr('y2', innerH)
          .attr('stroke', '#3a3a4a')
          .attr('stroke-width', 1);
      }

      if (y.domain()[0] < 0 && y.domain()[1] > 0) {
        g.append('line')
          .attr('x1', 0)
          .attr('x2', innerW)
          .attr('y1', y(0))
          .attr('y2', y(0))
          .attr('stroke', '#3a3a4a')
          .attr('stroke-width', 1);
      }

      // X axis
      g.append('g')
        .attr('transform', `translate(0,${innerH})`)
        .call(d3.axisBottom(x).ticks(8).tickFormat((d) => `${d}"`))
        .call((axis) => {
          axis.select('.domain').attr('stroke', '#3a3a4a');
          axis.selectAll('.tick line').attr('stroke', '#3a3a4a');
          axis.selectAll('.tick text').attr('fill', '#9898a8').attr('font-size', '10px');
        });

      // X axis label
      g.append('text')
        .attr('x', innerW / 2)
        .attr('y', innerH + margin.bottom - 6)
        .attr('text-anchor', 'middle')
        .attr('fill', '#7878a0')
        .attr('font-size', '10px')
        .text('Horizontal Break (in)');

      // Y axis
      g.append('g')
        .call(d3.axisLeft(y).ticks(8).tickFormat((d) => `${d}"`))
        .call((axis) => {
          axis.select('.domain').attr('stroke', '#3a3a4a');
          axis.selectAll('.tick line').attr('stroke', '#3a3a4a');
          axis.selectAll('.tick text').attr('fill', '#9898a8').attr('font-size', '10px');
        });

      // Y axis label
      g.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -innerH / 2)
        .attr('y', -margin.left + 14)
        .attr('text-anchor', 'middle')
        .attr('fill', '#7878a0')
        .attr('font-size', '10px')
        .text('Induced Vertical Break (in)');

      // League average points (hollow circles)
      const leagueByType = new Map(leagueAvg.map((p) => [p.pitchType, p]));

      for (const pt of leagueAvg) {
        const color = PITCH_COLORS[pt.pitchType] ?? '#9898a8';
        g.append('circle')
          .attr('cx', x(pt.hBreak))
          .attr('cy', y(pt.vBreak))
          .attr('r', 6)
          .attr('fill', 'none')
          .attr('stroke', color)
          .attr('stroke-width', 1.5)
          .attr('stroke-opacity', 0.5)
          .attr('stroke-dasharray', '2,2');
      }

      // Pitcher points (filled circles with labels)
      for (const pt of pitcher) {
        const color = PITCH_COLORS[pt.pitchType] ?? '#9898a8';
        const label = PITCH_LABELS[pt.pitchType] ?? pt.pitchType;

        // Connecting line from league avg to pitcher point
        const leaguePt = leagueByType.get(pt.pitchType);
        if (leaguePt) {
          g.append('line')
            .attr('x1', x(leaguePt.hBreak))
            .attr('y1', y(leaguePt.vBreak))
            .attr('x2', x(pt.hBreak))
            .attr('y2', y(pt.vBreak))
            .attr('stroke', color)
            .attr('stroke-width', 1)
            .attr('stroke-opacity', 0.25)
            .attr('stroke-dasharray', '3,3');
        }

        // Filled circle sized by usage
        const radius = Math.max(5, Math.min(12, 4 + pt.usagePct * 0.15));
        g.append('circle')
          .attr('cx', x(pt.hBreak))
          .attr('cy', y(pt.vBreak))
          .attr('r', radius)
          .attr('fill', color)
          .attr('fill-opacity', 0.85)
          .attr('stroke', '#0e0e18')
          .attr('stroke-width', 1.5);

        // Label
        g.append('text')
          .attr('x', x(pt.hBreak))
          .attr('y', y(pt.vBreak) - radius - 4)
          .attr('text-anchor', 'middle')
          .attr('fill', color)
          .attr('font-size', '9px')
          .attr('font-weight', '600')
          .text(label);
      }

      // Legend
      const pitchTypes = pitcher.map((p) => p.pitchType);
      const legendG = sel
        .append('g')
        .attr('transform', `translate(${width - margin.right + 8}, ${margin.top})`);

      pitchTypes.forEach((type, i) => {
        const color = PITCH_COLORS[type] ?? '#9898a8';
        const label = PITCH_LABELS[type] ?? type;
        const yPos = i * 20;

        // Filled circle (pitcher)
        legendG
          .append('circle')
          .attr('cx', 5)
          .attr('cy', yPos + 5)
          .attr('r', 4)
          .attr('fill', color);

        legendG
          .append('text')
          .attr('x', 14)
          .attr('y', yPos + 9)
          .attr('fill', '#c0c0d0')
          .attr('font-size', '9px')
          .text(label);
      });

      // League avg legend entry
      const legendBottom = pitchTypes.length * 20 + 8;
      legendG
        .append('circle')
        .attr('cx', 5)
        .attr('cy', legendBottom + 5)
        .attr('r', 4)
        .attr('fill', 'none')
        .attr('stroke', '#9898a8')
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '2,2');

      legendG
        .append('text')
        .attr('x', 14)
        .attr('y', legendBottom + 9)
        .attr('fill', '#808090')
        .attr('font-size', '9px')
        .text('Lg Avg');
    },
    [pitcher, leagueAvg],
  );

  return (
    <div className={styles.container}>
      <svg ref={containerRef} className={styles.svg} />
    </div>
  );
}
