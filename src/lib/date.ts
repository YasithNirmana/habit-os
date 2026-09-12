import { addDays, differenceInCalendarDays, format, parseISO, startOfMonth } from 'date-fns';

/** The app's canonical date string: `yyyy-MM-dd`, always device-local. */
export type ISODate = string;

export const toISODate = (d: Date): ISODate => format(d, 'yyyy-MM-dd');
export const fromISODate = (s: ISODate): Date => parseISO(s);
export const today = (): ISODate => toISODate(new Date());

export const shiftDate = (s: ISODate, days: number): ISODate =>
  toISODate(addDays(fromISODate(s), days));

export const daysBetween = (from: ISODate, to: ISODate): number =>
  differenceInCalendarDays(fromISODate(to), fromISODate(from));

/** Inclusive list of every date in a range, oldest first. */
export function eachDate(from: ISODate, to: ISODate): ISODate[] {
  const out: ISODate[] = [];
  const span = daysBetween(from, to);
  for (let i = 0; i <= span; i += 1) out.push(shiftDate(from, i));
  return out;
}

/** The window of equal length immediately before `from`..`to`. */
export function previousWindow(from: ISODate, to: ISODate): { from: ISODate; to: ISODate } {
  const len = daysBetween(from, to) + 1;
  return { from: shiftDate(from, -len), to: shiftDate(from, -1) };
}

export const monthStart = (s: ISODate): ISODate => toISODate(startOfMonth(fromISODate(s)));

export const formatDay = (s: ISODate): string => format(fromISODate(s), 'EEE d MMM');
export const formatDayLong = (s: ISODate): string => format(fromISODate(s), 'EEEE, d MMMM yyyy');
export const formatShort = (s: ISODate): string => format(fromISODate(s), 'd MMM');

export function relativeDayLabel(s: ISODate): string {
  const delta = daysBetween(today(), s);
  if (delta === 0) return 'Today';
  if (delta === -1) return 'Yesterday';
  if (delta === 1) return 'Tomorrow';
  return formatDay(s);
}
