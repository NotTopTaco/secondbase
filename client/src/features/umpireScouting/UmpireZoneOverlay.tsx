import * as d3 from 'd3';

/**
 * Creates a D3 draw function that renders a 5x5 umpire zone overlay on the
 * strike zone SVG. Each cell is shaded by delta from 50% (neutral).
 *
 * Blue = expanded zone (ump calls more strikes than expected)
 * Red  = squeezed zone (ump calls fewer strikes than expected)
 */
export function createUmpireOverlay(
  zones: Array<{ zoneId: number; calledStrikePct: number }>,
): (svgEl: SVGSVGElement, xScale: d3.ScaleLinear<number, number>, yScale: d3.ScaleLinear<number, number>) => void {
  const COLS = 5;
  const X_MIN = -1.25;
  const X_BAND = 0.5;
  const Y_MIN = 1.0;
  const Y_BAND = 0.6;

  const colorScale = d3
    .scaleLinear<string>()
    .domain([0, 0.5, 1])
    .range(['#e74c3c', '#888888', '#3498db'])
    .clamp(true);

  return (svgEl, xScale, yScale) => {
    const svg = d3.select(svgEl);

    // Remove previous overlay if present
    svg.selectAll('.umpire-overlay').remove();

    const g = svg.append('g').attr('class', 'umpire-overlay');

    for (const zone of zones) {
      const col = (zone.zoneId - 1) % COLS;
      const row = Math.floor((zone.zoneId - 1) / COLS);

      const x = xScale(X_MIN + col * X_BAND);
      const y = yScale(Y_MIN + (row + 1) * Y_BAND);
      const w = Math.abs(xScale(X_MIN + (col + 1) * X_BAND) - x);
      const h = Math.abs(yScale(Y_MIN + row * Y_BAND) - y);

      g.append('rect')
        .attr('x', x)
        .attr('y', y)
        .attr('width', w)
        .attr('height', h)
        .attr('fill', colorScale(zone.calledStrikePct / 100))
        .attr('opacity', 0.3)
        .attr('pointer-events', 'none');
    }
  };
}
