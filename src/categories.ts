import type { HabitCategory, HabitDirection, HabitKind } from './types';

export type CategoryMeta = {
  category: HabitCategory;
  kind: HabitKind;
  direction: HabitDirection;
  /** Plain-language name shown in the habit editor. */
  label: string;
  /** One line explaining the category, shown under the label. */
  blurb: string;
  /** Example habit, used as a placeholder. */
  example: string;
  /** Does this category need a user-supplied unit? */
  needsUnit: boolean;
  /** Label for the target field; null when a target makes no sense. */
  targetLabel: string | null;
  targetHint: string | null;
};

/**
 * The single source of truth for the six categories. Every screen, metric and
 * chart derives its behaviour from `kind` and `direction` rather than from the
 * category string, so a seventh category is a row here and nothing else.
 */
export const CATEGORIES: CategoryMeta[] = [
  {
    category: 'one_time_positive',
    kind: 'binary',
    direction: 'up',
    label: 'One-time · good',
    blurb: 'Something good you either did today or did not.',
    example: 'Made the bed',
    needsUnit: false,
    targetLabel: null,
    targetHint: null,
  },
  {
    category: 'one_time_negative',
    kind: 'binary',
    direction: 'down',
    label: 'One-time · bad',
    blurb: 'A slip you want to record and avoid. A clean day is a win.',
    example: 'Skipped breakfast',
    needsUnit: false,
    targetLabel: null,
    targetHint: null,
  },
  {
    category: 'time_positive',
    kind: 'duration',
    direction: 'up',
    label: 'Time spent · want more',
    blurb: 'Time on something good. Log as many sessions a day as you like.',
    example: 'Deep work',
    needsUnit: false,
    targetLabel: 'Daily target (minutes)',
    targetHint: 'A day counts as a hit when you reach or beat this.',
  },
  {
    category: 'time_negative',
    kind: 'duration',
    direction: 'down',
    label: 'Time spent · want less',
    blurb: 'Time you are trying to cut back. Less is better.',
    example: 'Doomscrolling',
    needsUnit: false,
    targetLabel: 'Daily ceiling (minutes)',
    targetHint: 'A day counts as a hit when you stay at or under this.',
  },
  {
    category: 'amount_positive',
    kind: 'amount',
    direction: 'up',
    label: 'Amount · want more',
    blurb: 'Anything you count and want to push up.',
    example: 'Pages read',
    needsUnit: true,
    targetLabel: 'Daily target',
    targetHint: 'A day counts as a hit when you reach or beat this.',
  },
  {
    category: 'amount_negative',
    kind: 'amount',
    direction: 'down',
    label: 'Amount · want less',
    blurb: 'Anything you count and want to push down.',
    example: 'Cigarettes',
    needsUnit: true,
    targetLabel: 'Daily ceiling',
    targetHint: 'A day counts as a hit when you stay at or under this.',
  },
];

const BY_CATEGORY = new Map(CATEGORIES.map((c) => [c.category, c]));

export function meta(category: HabitCategory): CategoryMeta {
  const found = BY_CATEGORY.get(category);
  if (!found) throw new Error(`Unknown habit category: ${category}`);
  return found;
}

export const kindOf = (category: HabitCategory): HabitKind => meta(category).kind;
export const directionOf = (category: HabitCategory): HabitDirection => meta(category).direction;

/** Unit suffix shown next to a value, e.g. `45 min` or `12 pages`. */
export function unitLabel(category: HabitCategory, unit: string | null): string {
  const k = kindOf(category);
  if (k === 'duration') return 'min';
  if (k === 'amount') return unit?.trim() || '';
  return '';
}

/** `95` → `1h 35m`; used wherever a duration total is displayed. */
export function formatMinutes(total: number): string {
  const rounded = Math.round(total);
  const h = Math.floor(rounded / 60);
  const m = rounded % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/** Render a daily total the way its category wants to be read. */
export function formatValue(
  category: HabitCategory,
  unit: string | null,
  value: number,
): string {
  const k = kindOf(category);
  if (k === 'binary') return value > 0 ? 'Yes' : 'No';
  if (k === 'duration') return formatMinutes(value);
  const n = Number.isInteger(value) ? String(value) : value.toFixed(1);
  const u = unitLabel(category, unit);
  return u ? `${n} ${u}` : n;
}
