import { kindOf } from '../categories';
import { formatShort } from '../lib/date';
import type { HabitSummary } from '../metrics/aggregate';

/**
 * Chart geometry, computed once and rendered twice: as react-native-svg on
 * screen and as an SVG string inside the exported PDF. Keeping the maths here
 * is what makes the PDF match the screen exactly.
 */
export type Prim =
  | { t: 'rect'; x: number; y: number; w: number; h: number; fill: string; rx?: number; opacity?: number }
  | { t: 'line'; x1: number; y1: number; x2: number; y2: number; stroke: string; width: number; dash?: string }
  | { t: 'path'; d: string; stroke?: string; fill?: string; width?: number; opacity?: number }
  | { t: 'text'; x: number; y: number; text: string; fill: string; size: number; anchor: 'start' | 'middle' | 'end'; weight?: number }
  | { t: 'circle'; cx: number; cy: number; r: number; fill: string };

export type ChartSpec = { width: number; height: number; prims: Prim[] };

export type ChartPalette = {
  grid: string;
  axisText: string;
  target: string;
  good: string;
  bad: string;
  miss: string;
};

export const screenPalette: ChartPalette = {
  grid: '#26313D',
  axisText: '#5C6B7A',
  target: '#F5A524',
  good: '#3DD68C',
  bad: '#F2555A',
  miss: '#26313D',
};

export const printPalette: ChartPalette = {
  grid: '#E2E8F0',
  axisText: '#64748B',
  target: '#B45309',
  good: '#15803D',
  bad: '#B91C1C',
  miss: '#E2E8F0',
};

const PAD = { left: 44, right: 10, top: 12, bottom: 20 };

function niceMax(v: number): number {
  if (v <= 0) return 1;
  const mag = 10 ** Math.floor(Math.log10(v));
  const step = [1, 2, 2.5, 5, 10].find((s) => v <= s * mag) ?? 10;
  return step * mag;
}

function fmtTick(v: number, minutes: boolean): string {
  if (minutes && v >= 60) {
    const h = v / 60;
    return Number.isInteger(h) ? `${h}h` : `${h.toFixed(1)}h`;
  }
  if (v >= 1000) return `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k`;
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}

export function buildChart(
  s: HabitSummary,
  opts: { width: number; height: number; palette: ChartPalette },
): ChartSpec {
  const { width, height, palette } = opts;
  const plotW = width - PAD.left - PAD.right;
  const plotH = height - PAD.top - PAD.bottom;
  const n = s.series.length;
  const prims: Prim[] = [];
  const binary = kindOf(s.habit.category) === 'binary';
  const minutes = kindOf(s.habit.category) === 'duration';

  const xAt = (i: number) => PAD.left + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW);

  // ------------------------------------------------------------ x labels ---
  const labelIdx = n <= 1 ? [0] : n < 4 ? [0, n - 1] : [0, Math.floor((n - 1) / 2), n - 1];
  for (const i of labelIdx) {
    prims.push({
      t: 'text',
      x: binary ? PAD.left + ((i + 0.5) / n) * plotW : xAt(i),
      y: height - 5,
      text: formatShort(s.series[i].date),
      fill: palette.axisText,
      size: 9,
      anchor: i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle',
    });
  }

  if (binary) {
    // A calendar strip: one bar per day, green when the day counted as a hit.
    const gap = n > 60 ? 0 : Math.min(3, plotW / n / 4);
    const bw = Math.max(1, plotW / n - gap);
    s.series.forEach((d, i) => {
      const hit = s.hits[i] === true;
      prims.push({
        t: 'rect',
        x: PAD.left + (i / n) * plotW,
        y: PAD.top,
        w: bw,
        h: plotH,
        rx: bw > 4 ? 2 : 0,
        fill: hit ? s.habit.color : palette.miss,
      });
    });
    prims.push({
      t: 'line',
      x1: PAD.left,
      y1: PAD.top + plotH,
      x2: PAD.left + plotW,
      y2: PAD.top + plotH,
      stroke: palette.grid,
      width: 1,
    });
    prims.push({
      t: 'text',
      x: PAD.left - 8,
      y: PAD.top + plotH / 2 + 3,
      text: `${s.hitDays}/${s.scoredDays}`,
      fill: palette.axisText,
      size: 10,
      anchor: 'end',
    });
    return { width, height, prims };
  }

  // ------------------------------------------------- continuous habits -----
  const peak = Math.max(...s.series.map((d) => d.value), s.target ?? 0, 0);
  const max = niceMax(peak * 1.1);
  const yAt = (v: number) => PAD.top + plotH - (v / max) * plotH;

  for (const frac of [0, 0.5, 1]) {
    const v = max * frac;
    const y = yAt(v);
    prims.push({
      t: 'line',
      x1: PAD.left,
      y1: y,
      x2: PAD.left + plotW,
      y2: y,
      stroke: palette.grid,
      width: 1,
    });
    prims.push({
      t: 'text',
      x: PAD.left - 8,
      y: y + 3,
      text: fmtTick(v, minutes),
      fill: palette.axisText,
      size: 9,
      anchor: 'end',
    });
  }

  const pts = s.series.map((d, i) => [xAt(i), yAt(d.value)] as const);
  const lineD = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const base = PAD.top + plotH;
  prims.push({
    t: 'path',
    d: `${lineD} L${pts[pts.length - 1][0].toFixed(1)} ${base} L${pts[0][0].toFixed(1)} ${base} Z`,
    fill: s.habit.color,
    opacity: 0.16,
  });
  prims.push({ t: 'path', d: lineD, stroke: s.habit.color, width: 2 });

  // Dots only when they will not turn the line into a caterpillar.
  if (n <= 45) {
    s.series.forEach((d, i) => {
      if (d.value === 0) return;
      prims.push({ t: 'circle', cx: pts[i][0], cy: pts[i][1], r: 2.5, fill: s.habit.color });
    });
  }

  if (s.target !== null) {
    const y = yAt(s.target);
    prims.push({
      t: 'line',
      x1: PAD.left,
      y1: y,
      x2: PAD.left + plotW,
      y2: y,
      stroke: palette.target,
      width: 1.5,
      dash: '5,4',
    });
    prims.push({
      t: 'text',
      x: PAD.left + plotW,
      y: y - 4,
      text: `target ${fmtTick(s.target, minutes)}`,
      fill: palette.target,
      size: 9,
      anchor: 'end',
    });
  }

  return { width, height, prims };
}
