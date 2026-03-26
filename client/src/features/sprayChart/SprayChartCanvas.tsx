import { useD3Bindable } from '../../hooks/useD3Bindable';
import {
  statcastToSvg,
  fieldOutlinePath,
  infieldPath,
  exitVeloRadius,
  FIELD,
} from './sprayChartUtils';
import { RESULT_COLORS } from '../../theme/colors';
import type { SprayChartHit } from '../../stores/matchupStore';
import * as d3 from 'd3';
import styles from './SprayChartCanvas.module.css';

interface SprayChartCanvasProps {
  hits: SprayChartHit[];
}

function resultToColor(result: string): string {
  const key = result.toLowerCase().replace(/[\s_]+/g, '');
  if (key.includes('single') || key === '1b') return RESULT_COLORS.single;
  if (key.includes('double') || key === '2b') return RESULT_COLORS.double;
  if (key.includes('triple') || key === '3b') return RESULT_COLORS.triple;
  if (key.includes('homerun') || key.includes('homer') || key === 'hr')
    return RESULT_COLORS.homeRun;
  return RESULT_COLORS.out;
}

export function SprayChartCanvas({ hits }: SprayChartCanvasProps) {
  const { containerRef } = useD3Bindable(
    (svg, { width, height }) => {
      const sel = d3.select(svg);
      sel.selectAll('*').remove();

      const size = Math.min(width, height);
      sel
        .attr('width', size)
        .attr('height', size)
        .attr('viewBox', `0 0 ${FIELD.width} ${FIELD.height}`);

      // Field outline
      sel
        .append('path')
        .attr('d', fieldOutlinePath())
        .attr('fill', '#0d1a0d')
        .attr('stroke', '#2a4a2a')
        .attr('stroke-width', 1);

      // Infield
      sel
        .append('path')
        .attr('d', infieldPath())
        .attr('fill', '#1a1208')
        .attr('stroke', '#3a3020')
        .attr('stroke-width', 0.5);

      // Home plate
      sel
        .append('circle')
        .attr('cx', FIELD.homeX)
        .attr('cy', FIELD.homeY)
        .attr('r', 2)
        .attr('fill', '#fff');

      // Plot hits
      const rScale = exitVeloRadius();

      hits.forEach((hit) => {
        const { x, y } = statcastToSvg(hit.coordX, hit.coordY);
        const color = resultToColor(hit.result);
        const r = rScale(hit.exitVelo);

        sel
          .append('circle')
          .attr('cx', x)
          .attr('cy', y)
          .attr('r', r)
          .attr('fill', color)
          .attr('opacity', 0.75)
          .attr('stroke', color)
          .attr('stroke-width', 0.5);
      });
    },
    [hits],
  );

  return (
    <div className={styles.container}>
      <svg ref={containerRef} className={styles.svg} />
    </div>
  );
}
