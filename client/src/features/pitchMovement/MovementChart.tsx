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
          .attr('fill', '#606070')
          .attr('font-size', '12px')
          .text('No movement data yet');
        return;
      }

      const margin = { top: 12, right: 12, bottom: 34, left: 42 };
      const innerW = width - margin.left - margin.right;
      const innerH = height - margin.top - margin.bottom;

      // Defs for reusable effects
      const defs = sel.append('defs');

      // Radial glow filter
      const glowFilter = defs.append('filter').attr('id', 'dot-glow');
      glowFilter.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'blur');
      glowFilter.append('feMerge')
        .selectAll('feMergeNode')
        .data(['blur', 'SourceGraphic'])
        .join('feMergeNode')
        .attr('in', (d) => d);

      const g = sel.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

      // Subtle inner background
      g.append('rect')
        .attr('width', innerW)
        .attr('height', innerH)
        .attr('fill', 'rgba(5, 10, 20, 0.3)')
        .attr('rx', 2);

      // Scales
      const allPoints = [...pitcher, ...leagueAvg];
      const hExtent = d3.extent(allPoints, (d) => d.hBreak) as [number, number];
      const vExtent = d3.extent(allPoints, (d) => d.vBreak) as [number, number];

      const hPad = Math.max((hExtent[1] - hExtent[0]) * 0.2, 3);
      const vPad = Math.max((vExtent[1] - vExtent[0]) * 0.2, 3);

      const x = d3.scaleLinear()
        .domain([hExtent[0] - hPad, hExtent[1] + hPad])
        .range([0, innerW])
        .nice();

      const y = d3.scaleLinear()
        .domain([vExtent[0] - vPad, vExtent[1] + vPad])
        .range([innerH, 0])
        .nice();

      // Grid
      const gridColor = '#132038';

      g.selectAll('.gx')
        .data(x.ticks(6))
        .join('line')
        .attr('x1', (d) => x(d)).attr('x2', (d) => x(d))
        .attr('y1', 0).attr('y2', innerH)
        .attr('stroke', gridColor)
        .attr('stroke-dasharray', '1,3');

      g.selectAll('.gy')
        .data(y.ticks(6))
        .join('line')
        .attr('x1', 0).attr('x2', innerW)
        .attr('y1', (d) => y(d)).attr('y2', (d) => y(d))
        .attr('stroke', gridColor)
        .attr('stroke-dasharray', '1,3');

      // Zero reference lines (stronger than grid)
      if (x.domain()[0] < 0 && x.domain()[1] > 0) {
        g.append('line')
          .attr('x1', x(0)).attr('x2', x(0))
          .attr('y1', 0).attr('y2', innerH)
          .attr('stroke', '#1e2d42')
          .attr('stroke-width', 1);
      }

      if (y.domain()[0] < 0 && y.domain()[1] > 0) {
        g.append('line')
          .attr('x1', 0).attr('x2', innerW)
          .attr('y1', y(0)).attr('y2', y(0))
          .attr('stroke', '#1e2d42')
          .attr('stroke-width', 1);
      }

      // Axes
      const axisFmt = (d: d3.NumberValue) => `${+d}"`;

      g.append('g')
        .attr('transform', `translate(0,${innerH})`)
        .call(d3.axisBottom(x).ticks(6).tickFormat(axisFmt))
        .call((a) => {
          a.select('.domain').attr('stroke', '#1e2d42');
          a.selectAll('.tick line').attr('stroke', '#1e2d42');
          a.selectAll('.tick text')
            .attr('fill', '#7878a0')
            .attr('font-size', '8px')
            .attr('font-family', 'JetBrains Mono, monospace');
        });

      g.append('text')
        .attr('x', innerW / 2)
        .attr('y', innerH + margin.bottom - 4)
        .attr('text-anchor', 'middle')
        .attr('fill', '#4a4a60')
        .attr('font-size', '8px')
        .attr('font-family', 'JetBrains Mono, monospace')
        .attr('letter-spacing', '0.06em')
        .text('HORIZONTAL BREAK');

      g.append('g')
        .call(d3.axisLeft(y).ticks(6).tickFormat(axisFmt))
        .call((a) => {
          a.select('.domain').attr('stroke', '#1e2d42');
          a.selectAll('.tick line').attr('stroke', '#1e2d42');
          a.selectAll('.tick text')
            .attr('fill', '#7878a0')
            .attr('font-size', '8px')
            .attr('font-family', 'JetBrains Mono, monospace');
        });

      g.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -innerH / 2)
        .attr('y', -margin.left + 10)
        .attr('text-anchor', 'middle')
        .attr('fill', '#4a4a60')
        .attr('font-size', '8px')
        .attr('font-family', 'JetBrains Mono, monospace')
        .attr('letter-spacing', '0.06em')
        .text('VERTICAL BREAK');

      // Build league avg lookup
      const leagueByType = new Map(leagueAvg.map((p) => [p.pitchType, p]));
      const lgRadius = 5;

      // Draw each pitch type: league avg ring + connecting line + pitcher dot
      // Drawn per-pitch so the visual grouping is obvious
      for (const pt of pitcher) {
        const color = PITCH_COLORS[pt.pitchType] ?? '#9898a8';
        const label = PITCH_LABELS[pt.pitchType] ?? pt.pitchType;
        const radius = Math.max(5, Math.min(10, 4 + pt.usagePct * 0.12));
        const cx = x(pt.hBreak);
        const cy = y(pt.vBreak);

        const leaguePt = leagueByType.get(pt.pitchType);

        // League avg: open ring in same color
        if (leaguePt) {
          const lx = x(leaguePt.hBreak);
          const ly = y(leaguePt.vBreak);

          g.append('circle')
            .attr('cx', lx).attr('cy', ly)
            .attr('r', lgRadius)
            .attr('fill', 'none')
            .attr('stroke', color)
            .attr('stroke-width', 1.5)
            .attr('stroke-opacity', 0.45);

          // "Lg" label next to the ring
          g.append('text')
            .attr('x', lx + lgRadius + 3)
            .attr('y', ly + 3)
            .attr('fill', color)
            .attr('fill-opacity', 0.4)
            .attr('font-size', '6px')
            .attr('font-family', 'JetBrains Mono, monospace')
            .text('LG');

          // Connecting line (shortened to not overlap ring or dot)
          const dist = Math.hypot(cx - lx, cy - ly);
          if (dist > lgRadius + radius + 6) {
            const dx = (cx - lx) / dist;
            const dy = (cy - ly) / dist;
            g.append('line')
              .attr('x1', lx + dx * (lgRadius + 2))
              .attr('y1', ly + dy * (lgRadius + 2))
              .attr('x2', cx - dx * (radius + 2))
              .attr('y2', cy - dy * (radius + 2))
              .attr('stroke', color)
              .attr('stroke-width', 0.75)
              .attr('stroke-opacity', 0.25)
              .attr('stroke-dasharray', '3,3');
          }
        }

        // Glow halo
        g.append('circle')
          .attr('cx', cx).attr('cy', cy)
          .attr('r', radius + 4)
          .attr('fill', color)
          .attr('fill-opacity', 0.08)
          .attr('filter', 'url(#dot-glow)');

        // Pitcher dot (filled)
        g.append('circle')
          .attr('cx', cx).attr('cy', cy)
          .attr('r', radius)
          .attr('fill', color)
          .attr('fill-opacity', 0.9)
          .attr('stroke', '#080c16')
          .attr('stroke-width', 1.5);

        // Pitch type label above
        g.append('text')
          .attr('x', cx)
          .attr('y', cy - radius - 5)
          .attr('text-anchor', 'middle')
          .attr('fill', color)
          .attr('font-size', '8px')
          .attr('font-weight', '600')
          .attr('font-family', 'Oswald, sans-serif')
          .attr('letter-spacing', '0.04em')
          .text(label);

        // Velocity below
        if (pt.velocity > 0) {
          g.append('text')
            .attr('x', cx)
            .attr('y', cy + radius + 10)
            .attr('text-anchor', 'middle')
            .attr('fill', '#505068')
            .attr('font-size', '7px')
            .attr('font-family', 'JetBrains Mono, monospace')
            .text(`${pt.velocity.toFixed(1)}`);
        }
      }
    },
    [pitcher, leagueAvg],
  );

  return (
    <div className={styles.container}>
      <svg ref={containerRef} className={styles.svg} />
    </div>
  );
}
