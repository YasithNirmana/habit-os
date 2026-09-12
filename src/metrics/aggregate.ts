import { directionOf, kindOf } from '../categories';
import { eachDate, type ISODate } from '../lib/date';
import type { Habit, HabitEntry } from '../types';

/** A habit's value for every day in a window; missing days are a real 0. */
export type DailySeries = { date: ISODate; value: number }[];

/** Sums the sessions of one habit per day across an inclusive window. */
export function dailySeries(
  entries: HabitEntry[],
  habitId: string,
  from: ISODate,
  to: ISODate,
): DailySeries {
  const totals = new Map<ISODate, number>();
  for (const e of entries) {
    if (e.habit_id !== habitId) continue;
    totals.set(e.entry_date, (totals.get(e.entry_date) ?? 0) + Number(e.value));
  }
  return eachDate(from, to).map((date) => ({ date, value: totals.get(date) ?? 0 }));
}

/** Totals for a single day, keyed by habit id. */
export function totalsByHabit(entries: HabitEntry[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const e of entries) {
    out.set(e.habit_id, (out.get(e.habit_id) ?? 0) + Number(e.value));
  }
  return out;
}

/**
 * The target a day is judged against. Binary habits carry an implicit one —
 * "did it" for the positive kind, "stayed clean" for the negative — so they are
 * always scored; duration and amount habits are scored only if you set one.
 */
export function effectiveTarget(habit: Habit): number | null {
  if (kindOf(habit.category) === 'binary') return directionOf(habit.category) === 'up' ? 1 : 0;
  return habit.target_value === null ? null : Number(habit.target_value);
}

/** `true` hit, `false` miss, `null` when the habit is not scored. */
export function isHit(habit: Habit, value: number): boolean | null {
  const target = effectiveTarget(habit);
  if (target === null) return null;
  return directionOf(habit.category) === 'up' ? value >= target : value <= target;
}

export type Streaks = { current: number; longest: number };

/** Current streak counts back from the most recent day in the window. */
export function streaks(hits: (boolean | null)[]): Streaks {
  let longest = 0;
  let run = 0;
  for (const h of hits) {
    if (h === true) {
      run += 1;
      longest = Math.max(longest, run);
    } else if (h === false) {
      run = 0;
    }
    // `null` days are unscored: they neither extend nor break a run.
  }
  let current = 0;
  for (let i = hits.length - 1; i >= 0; i -= 1) {
    if (hits[i] === true) current += 1;
    else if (hits[i] === false) break;
  }
  return { current, longest };
}

export type Trend = {
  /** Mean daily value this window. */
  current: number;
  /** Mean daily value over the equally long window immediately before. */
  previous: number;
  /** Signed change in the mean, in the habit's own unit. */
  change: number;
  /** Change as a percentage of the previous mean; null when there is no base. */
  changePct: number | null;
  /**
   * Did you get better? Direction-aware, so smoking 40 → 25 is `true` even
   * though the raw change is negative. `null` when the previous window is empty.
   */
  improving: boolean | null;
};

export function trend(
  habit: Habit,
  current: DailySeries,
  previous: DailySeries,
): Trend {
  const mean = (s: DailySeries) =>
    s.length === 0 ? 0 : s.reduce((a, d) => a + d.value, 0) / s.length;
  const cur = mean(current);
  const prev = mean(previous);
  const change = cur - prev;
  const hadData = previous.some((d) => d.value > 0);
  const changePct = prev === 0 ? null : (change / prev) * 100;
  let improving: boolean | null = null;
  if (hadData || cur > 0) {
    if (change === 0) improving = null;
    else improving = directionOf(habit.category) === 'up' ? change > 0 : change < 0;
  }
  return { current: cur, previous: prev, change, changePct, improving };
}

export type HabitSummary = {
  habit: Habit;
  series: DailySeries;
  hits: (boolean | null)[];
  target: number | null;
  total: number;
  average: number;
  best: { date: ISODate; value: number } | null;
  worst: { date: ISODate; value: number } | null;
  /** Days logged at all (non-zero), regardless of target. */
  activeDays: number;
  scoredDays: number;
  hitDays: number;
  /** null when the habit is not scored. */
  hitRate: number | null;
  streaks: Streaks;
  trend: Trend;
};

export function summarise(
  habit: Habit,
  entries: HabitEntry[],
  from: ISODate,
  to: ISODate,
  previousEntries: HabitEntry[],
  previousFrom: ISODate,
  previousTo: ISODate,
): HabitSummary {
  const series = dailySeries(entries, habit.id, from, to);
  const prevSeries = dailySeries(previousEntries, habit.id, previousFrom, previousTo);
  const hits = series.map((d) => isHit(habit, d.value));
  const total = series.reduce((a, d) => a + d.value, 0);
  const scored = hits.filter((h) => h !== null).length;
  const hitDays = hits.filter((h) => h === true).length;

  // "Best" and "worst" follow the habit's direction, and only consider days you
  // actually logged — an untouched day is an absence, not a personal record.
  const up = directionOf(habit.category) === 'up';
  const logged = series.filter((d) => d.value > 0);
  const pool = up ? series : logged;
  const sorted = [...pool].sort((a, b) => a.value - b.value);
  const best = sorted.length ? (up ? sorted[sorted.length - 1] : sorted[0]) : null;
  const worst = sorted.length ? (up ? sorted[0] : sorted[sorted.length - 1]) : null;

  return {
    habit,
    series,
    hits,
    target: effectiveTarget(habit),
    total,
    average: series.length ? total / series.length : 0,
    best,
    worst,
    activeDays: logged.length,
    scoredDays: scored,
    hitDays,
    hitRate: scored === 0 ? null : (hitDays / scored) * 100,
    streaks: streaks(hits),
    trend: trend(habit, series, prevSeries),
  };
}

/** Today screen footer: how many of the scored habits you hit. */
export function dayScore(
  habits: Habit[],
  totals: Map<string, number>,
): { hits: number; scored: number } {
  let hits = 0;
  let scored = 0;
  for (const h of habits) {
    const result = isHit(h, totals.get(h.id) ?? 0);
    if (result === null) continue;
    scored += 1;
    if (result) hits += 1;
  }
  return { hits, scored };
}
