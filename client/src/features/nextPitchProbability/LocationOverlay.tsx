import * as d3 from 'd3';

/**
 * Creates a D3 draw function that renders a shaded zone overlay
 * on the strike zone showing the predicted pitch location distribution.
 */
export function createPredictionOverlay(
  zoneDistribution: Record<string, number>,
): (svgEl: SVGSVGElement, xScale: d3.ScaleLinear<number, number>, yScale: d3.ScaleLinear<number, number>) => void {
  const COLS = 5;
  const X_MIN = -1.25;
  const X_BAND = 0.5;
  const Y_MIN = 1.0;
  const Y_BAND = 0.6;

  return (svgEl, xScale, yScale) => {
    const svg = d3.select(svgEl);

    // Remove previous overlay
    svg.selectAll('.prediction-overlay').remove();

    const entries = Object.entries(zoneDistribution);
    if (entries.length === 0) return;

    const maxPct = Math.max(...entries.map(([, v]) => v));
    if (maxPct === 0) return;

    const g = svg.append('g').attr('class', 'prediction-overlay');

    for (const [zoneStr, pct] of entries) {
      const zoneId = parseInt(zoneStr, 10);
      if (zoneId < 1 || zoneId > 25) continue;

      const col = (zoneId - 1) % COLS;
      const row = Math.floor((zoneId - 1) / COLS);

      const x = xScale(X_MIN + col * X_BAND);
      const y = yScale(Y_MIN + (row + 1) * Y_BAND);
      const w = Math.abs(xScale(X_MIN + (col + 1) * X_BAND) - x);
      const h = Math.abs(yScale(Y_MIN + row * Y_BAND) - y);

      const opacity = (pct / maxPct) * 0.35;

      g.append('rect')
        .attr('x', x)
        .attr('y', y)
        .attr('width', w)
        .attr('height', h)
        .attr('fill', '#F39C12')
        .attr('opacity', opacity)
        .attr('pointer-events', 'none');
    }
  };
}
