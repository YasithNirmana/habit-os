import { formatMinutes, kindOf, unitLabel } from '../categories';
import type { HabitSummary } from '../metrics/aggregate';

/** One habit's headline numbers, formatted once and shown on screen and in the PDF. */
export type Stat = { label: string; value: string };

function fmt(s: HabitSummary, v: number): string {
  const k = kindOf(s.habit.category);
  if (k === 'duration') return formatMinutes(v);
  const n = Number.isInteger(v) ? String(v) : v.toFixed(1);
  const u = unitLabel(s.habit.category, s.habit.unit);
  return u ? `${n} ${u}` : n;
}

export type TrendVerdict = { text: string; tone: 'good' | 'bad' | 'flat' };

/**
 * Progress or decline against the previous window of equal length. Reads in the
 * habit's own direction, so cutting a bad number is "improving", not "−37%".
 */
export function trendVerdict(s: HabitSummary): TrendVerdict {
  const { improving, changePct, change } = s.trend;
  if (improving === null) {
    return { text: 'No change vs previous period', tone: 'flat' };
  }
  const magnitude =
    changePct === null
      ? `${fmt(s, Math.abs(change))}/day`
      : `${Math.abs(changePct).toFixed(0)}%`;
  const word = change > 0 ? 'up' : 'down';
  return {
    text: `${improving ? 'Improving' : 'Slipping'} — ${word} ${magnitude} vs previous period`,
    tone: improving ? 'good' : 'bad',
  };
}

export function stats(s: HabitSummary): Stat[] {
  const k = kindOf(s.habit.category);
  const out: Stat[] = [];

  if (k === 'binary') {
    out.push({ label: 'Days done', value: `${s.activeDays} of ${s.series.length}` });
  } else {
    out.push({ label: 'Total', value: fmt(s, s.total) });
    out.push({ label: 'Daily average', value: fmt(s, Math.round(s.average * 10) / 10) });
    out.push({ label: 'Days logged', value: `${s.activeDays} of ${s.series.length}` });
    if (s.best) out.push({ label: 'Best day', value: fmt(s, s.best.value) });
    if (s.worst) out.push({ label: 'Worst day', value: fmt(s, s.worst.value) });
  }

  if (s.hitRate !== null) {
    out.push({ label: 'Hit rate', value: `${s.hitRate.toFixed(0)}%` });
    out.push({ label: 'Current streak', value: `${s.streaks.current} d` });
    out.push({ label: 'Longest streak', value: `${s.streaks.longest} d` });
  }

  return out;
}

/** Report-wide roll-up shown above the per-habit sections. */
export function overall(summaries: HabitSummary[]) {
  const scored = summaries.filter((s) => s.hitRate !== null);
  const hitDays = scored.reduce((a, s) => a + s.hitDays, 0);
  const scoredDays = scored.reduce((a, s) => a + s.scoredDays, 0);
  return {
    habits: summaries.length,
    hitRate: scoredDays === 0 ? null : (hitDays / scoredDays) * 100,
    improving: summaries.filter((s) => s.trend.improving === true).length,
    slipping: summaries.filter((s) => s.trend.improving === false).length,
  };
}
