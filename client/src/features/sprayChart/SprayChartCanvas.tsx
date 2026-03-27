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

      // SVG defs for gradients and glow
      const defs = sel.append('defs');

      const grassGrad = defs.append('radialGradient').attr('id', 'grassGrad');
      grassGrad.append('stop').attr('offset', '0%').attr('stop-color', '#152415');
      grassGrad.append('stop').attr('offset', '100%').attr('stop-color', '#0a180a');

      const dirtGrad = defs.append('radialGradient').attr('id', 'dirtGrad');
      dirtGrad.append('stop').attr('offset', '0%').attr('stop-color', '#231808');
      dirtGrad.append('stop').attr('offset', '100%').attr('stop-color', '#160e05');


      // Field outline
      sel
        .append('path')
        .attr('d', fieldOutlinePath())
        .attr('fill', 'url(#grassGrad)')
        .attr('stroke', '#2a4a2a')
        .attr('stroke-width', 1);

      // Infield
      sel
        .append('path')
        .attr('d', infieldPath())
        .attr('fill', 'url(#dirtGrad)')
        .attr('stroke', '#3a3020')
        .attr('stroke-width', 0.5);

      // Home plate diamond
      const hx = FIELD.homeX;
      const hy = FIELD.homeY;
      sel
        .append('polygon')
        .attr('points', `${hx},${hy - 3} ${hx + 3},${hy} ${hx},${hy + 3} ${hx - 3},${hy}`)
        .attr('fill', 'rgba(255, 255, 255, 0.8)');

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
