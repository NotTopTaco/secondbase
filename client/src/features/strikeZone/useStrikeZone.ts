import * as d3 from 'd3';
import { useD3Bindable } from '../../hooks/useD3Bindable';
import { ZONE, MARGIN, createXScale, createYScale, pitchShape } from './strikeZoneUtils';
import { PITCH_COLORS } from '../../theme/colors';
import type { PitchEvent } from '../../stores/gameStore';

interface TooltipData {
  x: number;
  y: number;
  pitch: PitchEvent;
}

export type OverlayFn = (
  svgEl: SVGSVGElement,
  xScale: d3.ScaleLinear<number, number>,
  yScale: d3.ScaleLinear<number, number>,
) => void;

interface UseStrikeZoneOptions {
  pitches: PitchEvent[];
  onTooltip?: (data: TooltipData | null) => void;
  overlays?: OverlayFn[];
}

export function useStrikeZone({ pitches, onTooltip, overlays }: UseStrikeZoneOptions) {
  return useD3Bindable(
    (svg, { width, height }) => {
      const sel = d3.select(svg);
      sel.selectAll('*').remove();

      sel.attr('width', width).attr('height', height);

      // SVG defs for glow filters and zone gradient
      const defs = sel.append('defs');

      const pitchGlow = defs.append('filter').attr('id', 'pitchGlow');
      pitchGlow.append('feGaussianBlur').attr('in', 'SourceGraphic').attr('stdDeviation', '2').attr('result', 'blur');
      const pitchMerge = pitchGlow.append('feMerge');
      pitchMerge.append('feMergeNode').attr('in', 'blur');
      pitchMerge.append('feMergeNode').attr('in', 'SourceGraphic');

      const zoneGrad = defs.append('radialGradient').attr('id', 'zoneGlow');
      zoneGrad.append('stop').attr('offset', '0%').attr('stop-color', 'rgba(74, 158, 255, 0.06)');
      zoneGrad.append('stop').attr('offset', '100%').attr('stop-color', 'rgba(74, 158, 255, 0.01)');

      const xScale = createXScale(width, MARGIN);
      const yScale = createYScale(height, MARGIN);

      // Draw zone rectangle
      sel
        .append('rect')
        .attr('x', xScale(ZONE.left))
        .attr('y', yScale(ZONE.top))
        .attr('width', xScale(ZONE.right) - xScale(ZONE.left))
        .attr('height', yScale(ZONE.bottom) - yScale(ZONE.top))
        .attr('fill', 'url(#zoneGlow)')
        .attr('stroke', 'rgba(74, 158, 255, 0.25)')
        .attr('stroke-width', 2);

      // Draw inner grid (3x3)
      const xStep = (ZONE.right - ZONE.left) / 3;
      const yStep = (ZONE.top - ZONE.bottom) / 3;

      for (let i = 1; i < 3; i++) {
        sel
          .append('line')
          .attr('x1', xScale(ZONE.left + i * xStep))
          .attr('x2', xScale(ZONE.left + i * xStep))
          .attr('y1', yScale(ZONE.top))
          .attr('y2', yScale(ZONE.bottom))
          .attr('stroke', 'rgba(74, 158, 255, 0.08)')
          .attr('stroke-width', 0.5);

        sel
          .append('line')
          .attr('x1', xScale(ZONE.left))
          .attr('x2', xScale(ZONE.right))
          .attr('y1', yScale(ZONE.bottom + i * yStep))
          .attr('y2', yScale(ZONE.bottom + i * yStep))
          .attr('stroke', 'rgba(74, 158, 255, 0.08)')
          .attr('stroke-width', 0.5);
      }

      // Home plate
      const plateW = xScale(ZONE.right) - xScale(ZONE.left);
      const plateX = xScale(0);
      const plateY = yScale(ZONE.bottom) + 15;
      sel
        .append('polygon')
        .attr(
          'points',
          `${plateX - plateW / 2},${plateY} ${plateX - plateW / 2},${plateY + 6} ${plateX},${plateY + 12} ${plateX + plateW / 2},${plateY + 6} ${plateX + plateW / 2},${plateY}`,
        )
        .attr('fill', 'rgba(255, 255, 255, 0.08)')
        .attr('stroke', '#3a3a4a')
        .attr('stroke-width', 1);

      // Render overlays (between zone and pitches)
      if (overlays) {
        for (const overlayFn of overlays) {
          overlayFn(svg, xScale, yScale);
        }
      }

      // Plot pitches
      const g = sel.append('g');
      const r = 8;

      pitches.forEach((p, i) => {
        if (p.pX == null || p.pZ == null || isNaN(p.pX) || isNaN(p.pZ)) return;
        const cx = xScale(p.pX);
        const cy = yScale(p.pZ);
        const color = PITCH_COLORS[p.type] ?? '#9898a8';
        const shape = pitchShape(p.isStrike, p.isBall, p.isInPlay);

        const pitchG = g.append('g')
          .style('cursor', 'pointer')
          .attr('filter', 'url(#pitchGlow)')
          .style('opacity', '0');

        // Staggered entrance animation
        pitchG
          .transition()
          .delay(i * 30)
          .duration(300)
          .style('opacity', '1');

        if (shape === 'diamond') {
          pitchG
            .append('rect')
            .attr('x', cx - r * 0.7)
            .attr('y', cy - r * 0.7)
            .attr('width', r * 1.4)
            .attr('height', r * 1.4)
            .attr('transform', `rotate(45, ${cx}, ${cy})`)
            .attr('fill', color)
            .attr('opacity', 0.85);
        } else if (shape === 'open') {
          pitchG
            .append('circle')
            .attr('cx', cx)
            .attr('cy', cy)
            .attr('r', r)
            .attr('fill', 'transparent');
          pitchG
            .append('circle')
            .attr('cx', cx)
            .attr('cy', cy)
            .attr('r', r)
            .attr('fill', 'none')
            .attr('stroke', color)
            .attr('stroke-width', 2)
            .attr('opacity', 0.85);
        } else {
          pitchG
            .append('circle')
            .attr('cx', cx)
            .attr('cy', cy)
            .attr('r', r)
            .attr('fill', color)
            .attr('opacity', 0.85);
        }

        // Sequence number
        pitchG
          .append('text')
          .attr('x', cx)
          .attr('y', cy)
          .attr('dy', '0.35em')
          .attr('text-anchor', 'middle')
          .attr('font-size', '9px')
          .attr('font-weight', '600')
          .attr('fill', shape === 'open' ? color : '#fff')
          .attr('pointer-events', 'none')
          .text(p.pitchNumber);

        // Velocity label
        if (p.speed > 0) {
          pitchG
            .append('text')
            .attr('x', cx + r + 3)
            .attr('y', cy)
            .attr('dy', '0.35em')
            .attr('font-size', '9px')
            .attr('fill', '#9898a8')
            .attr('pointer-events', 'none')
            .text(`${p.speed.toFixed(0)}`);
        }

        // Hover interaction
        pitchG
          .on('mouseenter', (event: MouseEvent) => {
            onTooltip?.({ x: event.clientX, y: event.clientY, pitch: p });
          })
          .on('mousemove', (event: MouseEvent) => {
            onTooltip?.({ x: event.clientX, y: event.clientY, pitch: p });
          })
          .on('mouseleave', () => {
            onTooltip?.(null);
          });
      });
    },
    [pitches, overlays],
  );
}
