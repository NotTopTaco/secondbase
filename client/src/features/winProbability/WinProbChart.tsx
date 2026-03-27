import * as d3 from 'd3';
import { useD3Bindable } from '../../hooks/useD3Bindable';
import styles from './WinProbChart.module.css';

interface WpEvent {
  playIndex: number;
  inning: number;
  halfInning: string;
  event: string;
  description: string;
  homeWp: number;
  delta: number;
}

interface WinProbChartProps {
  events: WpEvent[];
  biggestSwing: Pick<WpEvent, 'playIndex' | 'event' | 'description' | 'homeWp' | 'delta'> | null;
}

export function WinProbChart({ events, biggestSwing }: WinProbChartProps) {
  const { containerRef } = useD3Bindable(
    (svg, { width, height }) => {
      const sel = d3.select(svg);
      sel.selectAll('*').remove();
      sel.attr('width', width).attr('height', height);

      if (events.length === 0) return;

      const margin = { top: 20, right: 20, bottom: 30, left: 40 };
      const innerW = width - margin.left - margin.right;
      const innerH = height - margin.top - margin.bottom;

      const g = sel
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      const xScale = d3
        .scaleLinear()
        .domain([0, events.length - 1])
        .range([0, innerW]);

      const yScale = d3
        .scaleLinear()
        .domain([0, 100])
        .range([innerH, 0]);

      // X axis
      g.append('g')
        .attr('transform', `translate(0,${innerH})`)
        .call(
          d3
            .axisBottom(xScale)
            .ticks(Math.min(events.length, 8))
            .tickFormat((d) => {
              const idx = Math.round(d as number);
              const ev = events[idx];
              if (!ev) return '';
              const half = ev.halfInning === 'top' ? 'T' : 'B';
              return `${half}${ev.inning}`;
            }),
        )
        .selectAll('text')
        .attr('fill', 'var(--text-muted)')
        .attr('font-size', '10px');

      g.selectAll('.domain, .tick line').attr('stroke', 'var(--text-muted)');

      // Y axis
      g.append('g')
        .call(
          d3
            .axisLeft(yScale)
            .ticks(5)
            .tickFormat((d) => `${d}%`),
        )
        .selectAll('text')
        .attr('fill', 'var(--text-muted)')
        .attr('font-size', '10px');

      g.selectAll('.domain, .tick line').attr('stroke', 'var(--text-muted)');

      // Dashed 50% line
      g.append('line')
        .attr('x1', 0)
        .attr('x2', innerW)
        .attr('y1', yScale(50))
        .attr('y2', yScale(50))
        .attr('stroke', 'var(--text-muted)')
        .attr('stroke-dasharray', '4 4')
        .attr('stroke-width', 1)
        .attr('opacity', 0.6);

      const lineData = events.map((e, i) => ({
        x: xScale(i),
        y: yScale(e.homeWp),
      }));

      // Area fill below line
      const area = d3
        .area<{ x: number; y: number }>()
        .x((d) => d.x)
        .y0(innerH)
        .y1((d) => d.y)
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(lineData)
        .attr('d', area)
        .attr('fill', 'rgba(59, 130, 246, 0.15)');

      // Line
      const line = d3
        .line<{ x: number; y: number }>()
        .x((d) => d.x)
        .y((d) => d.y)
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(lineData)
        .attr('d', line)
        .attr('fill', 'none')
        .attr('stroke', '#3b82f6')
        .attr('stroke-width', 2);

      // Biggest swing highlight
      if (biggestSwing) {
        const idx = events.findIndex(
          (e) => e.playIndex === biggestSwing.playIndex,
        );
        if (idx >= 0) {
          const cx = xScale(idx);
          const cy = yScale(events[idx].homeWp);

          g.append('circle')
            .attr('cx', cx)
            .attr('cy', cy)
            .attr('r', 5)
            .attr('fill', '#f59e0b')
            .attr('stroke', '#fff')
            .attr('stroke-width', 1.5);
        }
      }
    },
    [events, biggestSwing],
  );

  return (
    <div className={styles.container}>
      <svg ref={containerRef} className={styles.svg} />
    </div>
  );
}
