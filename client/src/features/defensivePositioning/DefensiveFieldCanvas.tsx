import * as d3 from 'd3';
import { useD3Bindable } from '../../hooks/useD3Bindable';
import { FIELD, fieldOutlinePath, infieldPath, statcastToSvg } from './defensivePositioningUtils';
import { RESULT_COLORS } from '../../theme/colors';
import type { SprayChartHit } from '../../stores/matchupStore';
import styles from './DefensiveFieldCanvas.module.css';

interface FielderDot {
  position: string;
  svgX: number;
  svgY: number;
  playerName: string;
}

interface OptimalPos {
  position: string;
  x: number;
  y: number;
}

interface DefensiveFieldCanvasProps {
  fielders: FielderDot[];
  hits: SprayChartHit[];
  optimalPositions: OptimalPos[];
  showSprayDots: boolean;
  showOptimal: boolean;
}

function resultColor(result: string): string {
  if (result.includes('single') || result === 'single') return RESULT_COLORS.single;
  if (result.includes('double') || result === 'double') return RESULT_COLORS.double;
  if (result.includes('triple') || result === 'triple') return RESULT_COLORS.triple;
  if (result.includes('home_run') || result === 'homeRun') return RESULT_COLORS.homeRun;
  return RESULT_COLORS.out;
}

export function DefensiveFieldCanvas({
  fielders,
  hits,
  optimalPositions,
  showSprayDots,
  showOptimal,
}: DefensiveFieldCanvasProps) {
  const { containerRef } = useD3Bindable(
    (svg, { width, height }) => {
      const sel = d3.select(svg);
      sel.selectAll('*').remove();

      const size = Math.min(width, height);
      sel
        .attr('width', size)
        .attr('height', size)
        .attr('viewBox', `0 0 ${FIELD.width} ${FIELD.height}`);

      // Defs: field gradients
      const defs = sel.append('defs');
      const grassGrad = defs.append('radialGradient').attr('id', 'defFieldGrass');
      grassGrad.append('stop').attr('offset', '0%').attr('stop-color', '#1a3a1a');
      grassGrad.append('stop').attr('offset', '100%').attr('stop-color', '#122812');

      const dirtGrad = defs.append('radialGradient').attr('id', 'defFieldDirt');
      dirtGrad.append('stop').attr('offset', '0%').attr('stop-color', '#3d2b1a');
      dirtGrad.append('stop').attr('offset', '100%').attr('stop-color', '#2a1f14');

      // Layer 1: Field background
      sel.append('path')
        .attr('d', fieldOutlinePath())
        .attr('fill', 'url(#defFieldGrass)')
        .attr('stroke', '#2a5a2a')
        .attr('stroke-width', 1);

      sel.append('path')
        .attr('d', infieldPath())
        .attr('fill', 'url(#defFieldDirt)')
        .attr('stroke', '#4a3520')
        .attr('stroke-width', 0.5);

      // Home plate
      sel.append('rect')
        .attr('x', FIELD.homeX - 2.5)
        .attr('y', FIELD.homeY - 2.5)
        .attr('width', 5)
        .attr('height', 5)
        .attr('fill', '#ffffff')
        .attr('transform', `rotate(45, ${FIELD.homeX}, ${FIELD.homeY})`);

      // Layer 2: Spray chart dots (behind fielders)
      if (showSprayDots && hits.length > 0) {
        for (const hit of hits) {
          const pos = statcastToSvg(hit.coordX, hit.coordY);
          sel.append('circle')
            .attr('cx', pos.x)
            .attr('cy', pos.y)
            .attr('r', 2.5)
            .attr('fill', resultColor(hit.result))
            .attr('opacity', 0.35);
        }
      }

      // Layer 3: Optimal position indicators
      if (showOptimal) {
        for (const opt of optimalPositions) {
          sel.append('circle')
            .attr('cx', opt.x)
            .attr('cy', opt.y)
            .attr('r', 5)
            .attr('fill', 'none')
            .attr('stroke', '#F39C12')
            .attr('stroke-width', 1.5)
            .attr('stroke-dasharray', '3,2')
            .attr('opacity', 0.8);

          // Arrow from current to optimal
          const current = fielders.find(f => f.position === opt.position);
          if (current) {
            sel.append('line')
              .attr('x1', current.svgX)
              .attr('y1', current.svgY)
              .attr('x2', opt.x)
              .attr('y2', opt.y)
              .attr('stroke', '#F39C12')
              .attr('stroke-width', 1)
              .attr('stroke-dasharray', '2,2')
              .attr('opacity', 0.5);
          }
        }
      }

      // Layer 4: Fielder position dots
      for (const f of fielders) {
        sel.append('circle')
          .attr('cx', f.svgX)
          .attr('cy', f.svgY)
          .attr('r', 7)
          .attr('fill', '#ffffff')
          .attr('stroke', '#00BCD4')
          .attr('stroke-width', 2);

        sel.append('text')
          .attr('x', f.svgX)
          .attr('y', f.svgY + 1)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .attr('font-size', 7)
          .attr('font-weight', 700)
          .attr('fill', '#1a1a2e')
          .text(f.position);
      }
    },
    [fielders, hits, optimalPositions, showSprayDots, showOptimal],
  );

  return (
    <div className={styles.canvasContainer}>
      <svg ref={containerRef} className={styles.svg} />
    </div>
  );
}
