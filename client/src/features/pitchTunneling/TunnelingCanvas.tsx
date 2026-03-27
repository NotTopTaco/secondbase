import * as d3 from 'd3';
import { useD3Bindable } from '../../hooks/useD3Bindable';
import { computeTrajectory, computeDecisionFraction } from './trajectoryMath';
import { PITCH_COLORS } from '../../theme/colors';
import type { TunnelPair } from '../../api/playerApi';
import styles from './tunneling.module.css';

interface TunnelingCanvasProps {
  pair: TunnelPair;
  viewMode: 'side' | 'batter';
}

const MARGIN = { top: 20, right: 20, bottom: 35, left: 50 };

export function TunnelingCanvas({ pair, viewMode }: TunnelingCanvasProps) {
  const { containerRef } = useD3Bindable(
    (svg, { width, height }) => {
      const sel = d3.select(svg);
      sel.selectAll('*').remove();
      sel.attr('width', width).attr('height', height);

      const trajA = computeTrajectory({
        releaseX: pair.releaseXA, releaseZ: pair.releaseZA,
        extension: pair.extensionA, velocity: pair.velocityA,
        pfxX: pair.pfxXA, pfxZ: pair.pfxZA,
        plateX: pair.plateXA, plateZ: pair.plateZA,
      });
      const trajB = computeTrajectory({
        releaseX: pair.releaseXB, releaseZ: pair.releaseZB,
        extension: pair.extensionB, velocity: pair.velocityB,
        pfxX: pair.pfxXB, pfxZ: pair.pfxZB,
        plateX: pair.plateXB, plateZ: pair.plateZB,
      });

      const decFracA = computeDecisionFraction(pair.velocityA, pair.extensionA);
      const decFracB = computeDecisionFraction(pair.velocityB, pair.extensionB);
      const decFrac = (decFracA + decFracB) / 2;

      const colorA = PITCH_COLORS[pair.pitchTypeA] ?? '#ffffff';
      const colorB = PITCH_COLORS[pair.pitchTypeB] ?? '#aaaaaa';

      if (viewMode === 'side') {
        drawSideView(sel, width, height, trajA, trajB, decFrac, colorA, colorB, pair);
      } else {
        drawBatterView(sel, width, height, trajA, trajB, decFrac, colorA, colorB, pair);
      }
    },
    [pair, viewMode],
  );

  return (
    <div className={styles.canvasContainer}>
      <svg ref={containerRef} className={styles.svg} />
    </div>
  );
}

function drawSideView(
  sel: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  width: number, height: number,
  trajA: ReturnType<typeof computeTrajectory>,
  trajB: ReturnType<typeof computeTrajectory>,
  decFrac: number,
  colorA: string, colorB: string,
  pair: TunnelPair,
) {
  const w = width - MARGIN.left - MARGIN.right;
  const h = height - MARGIN.top - MARGIN.bottom;
  const g = sel.append('g').attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

  // X axis: distance from plate (release -> plate = left to right)
  const yMin = Math.min(trajA[0].y, trajB[0].y);
  const x = d3.scaleLinear().domain([yMin, 1.417]).range([0, w]);
  // Y axis: height
  const allZ = [...trajA, ...trajB].map(p => p.z);
  const zPad = 0.5;
  const y = d3.scaleLinear().domain([Math.min(...allZ) - zPad, Math.max(...allZ) + zPad]).range([h, 0]);

  // Grid
  g.append('rect').attr('width', w).attr('height', h).attr('fill', '#0d1117');

  // Decision point line
  const decY = trajA[0].y - (trajA[0].y - 1.417) * decFrac;
  g.append('line')
    .attr('x1', x(decY)).attr('x2', x(decY))
    .attr('y1', 0).attr('y2', h)
    .attr('stroke', '#F39C12')
    .attr('stroke-width', 1)
    .attr('stroke-dasharray', '4,3')
    .attr('opacity', 0.7);

  g.append('text')
    .attr('x', x(decY) + 4)
    .attr('y', 12)
    .attr('fill', '#F39C12')
    .attr('font-size', 9)
    .text('Decision');

  // Plate line
  g.append('line')
    .attr('x1', x(1.417)).attr('x2', x(1.417))
    .attr('y1', 0).attr('y2', h)
    .attr('stroke', '#ffffff')
    .attr('stroke-width', 1)
    .attr('opacity', 0.3);

  // Trajectories
  const lineGen = d3.line<(typeof trajA)[0]>()
    .x(d => x(d.y))
    .y(d => y(d.z))
    .curve(d3.curveMonotoneX);

  g.append('path').datum(trajA).attr('d', lineGen).attr('fill', 'none').attr('stroke', colorA).attr('stroke-width', 2.5);
  g.append('path').datum(trajB).attr('d', lineGen).attr('fill', 'none').attr('stroke', colorB).attr('stroke-width', 2.5);

  // Axes
  const xAxis = d3.axisBottom(x).ticks(5).tickFormat(d => `${(d as number).toFixed(0)} ft`);
  g.append('g').attr('transform', `translate(0,${h})`).call(xAxis)
    .selectAll('text').attr('fill', '#9898a8').attr('font-size', 9);
  g.selectAll('.domain, .tick line').attr('stroke', '#3a3a4a');

  const yAxis = d3.axisLeft(y).ticks(4).tickFormat(d => `${(d as number).toFixed(1)}'`);
  g.append('g').call(yAxis)
    .selectAll('text').attr('fill', '#9898a8').attr('font-size', 9);

  // Labels
  g.append('text').attr('x', x(trajA[0].y) - 5).attr('y', y(trajA[0].z)).attr('fill', colorA).attr('font-size', 10).attr('text-anchor', 'end').text(pair.pitchTypeA);
  g.append('text').attr('x', x(trajB[0].y) - 5).attr('y', y(trajB[0].z) + 12).attr('fill', colorB).attr('font-size', 10).attr('text-anchor', 'end').text(pair.pitchTypeB);
}

function drawBatterView(
  sel: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  width: number, height: number,
  trajA: ReturnType<typeof computeTrajectory>,
  trajB: ReturnType<typeof computeTrajectory>,
  decFrac: number,
  colorA: string, colorB: string,
  pair: TunnelPair,
) {
  const w = width - MARGIN.left - MARGIN.right;
  const h = height - MARGIN.top - MARGIN.bottom;
  const g = sel.append('g').attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

  // X: horizontal, Y: height (batter's eye view)
  const x = d3.scaleLinear().domain([-1.5, 1.5]).range([0, w]);
  const y = d3.scaleLinear().domain([1.0, 4.5]).range([h, 0]);

  g.append('rect').attr('width', w).attr('height', h).attr('fill', '#0d1117');

  // Strike zone
  g.append('rect')
    .attr('x', x(-0.83)).attr('y', y(3.5))
    .attr('width', x(0.83) - x(-0.83))
    .attr('height', y(1.5) - y(3.5))
    .attr('fill', 'none')
    .attr('stroke', '#ffffff')
    .attr('stroke-width', 1)
    .attr('opacity', 0.3);

  // Find positions at decision point
  const decIdxA = Math.round(decFrac * (trajA.length - 1));
  const decIdxB = Math.round(decFrac * (trajB.length - 1));
  const decA = trajA[decIdxA];
  const decB = trajB[decIdxB];
  const plateA = trajA[trajA.length - 1];
  const plateB = trajB[trajB.length - 1];

  // Decision point dots (nearly overlapping)
  g.append('circle').attr('cx', x(decA.x)).attr('cy', y(decA.z)).attr('r', 5).attr('fill', colorA).attr('opacity', 0.6);
  g.append('circle').attr('cx', x(decB.x)).attr('cy', y(decB.z)).attr('r', 5).attr('fill', colorB).attr('opacity', 0.6);

  // Paths from decision to plate
  g.append('line')
    .attr('x1', x(decA.x)).attr('y1', y(decA.z))
    .attr('x2', x(plateA.x)).attr('y2', y(plateA.z))
    .attr('stroke', colorA).attr('stroke-width', 2).attr('stroke-dasharray', '4,2');

  g.append('line')
    .attr('x1', x(decB.x)).attr('y1', y(decB.z))
    .attr('x2', x(plateB.x)).attr('y2', y(plateB.z))
    .attr('stroke', colorB).attr('stroke-width', 2).attr('stroke-dasharray', '4,2');

  // Plate dots
  g.append('circle').attr('cx', x(plateA.x)).attr('cy', y(plateA.z)).attr('r', 6).attr('fill', colorA);
  g.append('circle').attr('cx', x(plateB.x)).attr('cy', y(plateB.z)).attr('r', 6).attr('fill', colorB);

  // Labels at plate
  g.append('text').attr('x', x(plateA.x) + 8).attr('y', y(plateA.z) + 4).attr('fill', colorA).attr('font-size', 10).text(pair.pitchTypeA);
  g.append('text').attr('x', x(plateB.x) + 8).attr('y', y(plateB.z) + 4).attr('fill', colorB).attr('font-size', 10).text(pair.pitchTypeB);

  // "Decision" label near the convergence point
  const midX = (decA.x + decB.x) / 2;
  const midZ = (decA.z + decB.z) / 2;
  g.append('text')
    .attr('x', x(midX)).attr('y', y(midZ) - 10)
    .attr('text-anchor', 'middle')
    .attr('fill', '#F39C12')
    .attr('font-size', 9)
    .text('Decision Point');
}
