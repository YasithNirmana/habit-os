import { buildChart, printPalette } from '../charts/series';
import { toSvg } from '../charts/toSvg';
import { meta } from '../categories';
import { formatDayLong } from '../lib/date';
import type { Report } from '../hooks/useRangeReport';
import { overall, stats, trendVerdict } from './stats';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * An A4 report. The charts are the same ChartSpec the screen draws, serialised
 * to SVG, so the PDF is guaranteed to match what you looked at.
 */
export function buildHtml(report: Report): string {
  const o = overall(report.summaries);

  const sections = report.summaries
    .map((s) => {
      const spec = buildChart(s, { width: 520, height: 150, palette: printPalette });
      const v = trendVerdict(s);
      const cells = stats(s)
        .map(
          (st) =>
            `<div class="stat"><div class="stat-l">${esc(st.label)}</div><div class="stat-v">${esc(st.value)}</div></div>`,
        )
        .join('');
      return `
      <section class="habit">
        <div class="habit-head">
          <span class="dot" style="background:${s.habit.color}"></span>
          <h2>${esc(s.habit.name)}</h2>
          <span class="cat">${esc(meta(s.habit.category).label)}</span>
        </div>
        <p class="trend ${v.tone}">${esc(v.text)}</p>
        <div class="chart">${toSvg(spec)}</div>
        <div class="stats">${cells}</div>
      </section>`;
    })
    .join('');

  return `<!doctype html>
<html><head><meta charset="utf-8"><title>Habit OS report</title>
<style>
  @page { size: A4; margin: 14mm; }
  * { box-sizing: border-box; }
  body { font-family: Helvetica, Arial, sans-serif; color: #0F172A; margin: 0; font-size: 11px; }
  header { border-bottom: 2px solid #0F172A; padding-bottom: 10px; margin-bottom: 16px; }
  h1 { font-size: 22px; margin: 0 0 2px; letter-spacing: -0.4px; }
  .range { color: #475569; font-size: 12px; }
  .overall { display: flex; gap: 22px; margin: 14px 0 22px; }
  .overall div span { display: block; }
  .o-l { color: #64748B; font-size: 9px; letter-spacing: 0.8px; text-transform: uppercase; }
  .o-v { font-size: 19px; font-weight: 700; }
  .habit { page-break-inside: avoid; border: 1px solid #E2E8F0; border-radius: 8px;
           padding: 12px 14px; margin-bottom: 12px; }
  .habit-head { display: flex; align-items: center; gap: 8px; }
  .habit-head h2 { font-size: 14px; margin: 0; flex: 1; }
  .dot { width: 9px; height: 9px; border-radius: 50%; display: inline-block; }
  .cat { color: #64748B; font-size: 10px; }
  .trend { margin: 4px 0 8px; font-size: 11px; font-weight: 600; }
  .trend.good { color: #15803D; }
  .trend.bad  { color: #B91C1C; }
  .trend.flat { color: #64748B; }
  .chart { margin: 2px 0 10px; }
  .stats { display: flex; flex-wrap: wrap; gap: 6px; }
  .stat { border: 1px solid #E2E8F0; border-radius: 6px; padding: 5px 9px; min-width: 78px; }
  .stat-l { color: #64748B; font-size: 8px; text-transform: uppercase; letter-spacing: 0.6px; }
  .stat-v { font-size: 13px; font-weight: 700; }
  footer { margin-top: 14px; color: #94A3B8; font-size: 9px; text-align: center; }
</style></head>
<body>
  <header>
    <h1>Habit OS</h1>
    <div class="range">${esc(formatDayLong(report.from))} &rarr; ${esc(formatDayLong(report.to))}</div>
  </header>

  <div class="overall">
    <div><span class="o-l">Habits</span><span class="o-v">${o.habits}</span></div>
    <div><span class="o-l">Overall hit rate</span><span class="o-v">${o.hitRate === null ? '—' : `${o.hitRate.toFixed(0)}%`}</span></div>
    <div><span class="o-l">Improving</span><span class="o-v">${o.improving}</span></div>
    <div><span class="o-l">Slipping</span><span class="o-v">${o.slipping}</span></div>
  </div>

  ${sections || '<p>No habits in this period.</p>'}

  <footer>Generated ${esc(new Date().toLocaleString())} · Habit OS</footer>
</body></html>`;
}
