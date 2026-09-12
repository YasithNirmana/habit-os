import { useQuery } from '@tanstack/react-query';
import { entriesInRange } from '../api/entries';
import { previousWindow, type ISODate } from '../lib/date';
import { summarise, type HabitSummary } from '../metrics/aggregate';
import { useHabits } from './useHabits';
import { dayKeys } from './useDayLog';
import type { Habit } from '../types';

export type Report = {
  from: ISODate;
  to: ISODate;
  summaries: HabitSummary[];
};

/**
 * One query fetches the selected window plus the equally long window before it
 * (needed for the progress/decline comparison); everything else is aggregated
 * on the client, which at a year of daily data is a few thousand rows.
 */
export function useReport(from: ISODate, to: ISODate) {
  const habitsQuery = useHabits(true);
  const prev = previousWindow(from, to);

  const entriesQuery = useQuery({
    queryKey: dayKeys.range(prev.from, to),
    queryFn: () => entriesInRange(prev.from, to),
  });

  const habits = habitsQuery.data;
  const entries = entriesQuery.data;

  let report: Report | undefined;
  if (habits && entries) {
    const inWindow = entries.filter((e) => e.entry_date >= from && e.entry_date <= to);
    const inPrev = entries.filter((e) => e.entry_date >= prev.from && e.entry_date <= prev.to);
    // Archived habits still appear if they have data in the window — history
    // should not vanish because you retired the habit.
    const relevant = habits.filter(
      (h: Habit) => h.archived_at === null || inWindow.some((e) => e.habit_id === h.id),
    );
    report = {
      from,
      to,
      summaries: relevant.map((h: Habit) =>
        summarise(h, inWindow, from, to, inPrev, prev.from, prev.to),
      ),
    };
  }

  return {
    report,
    isLoading: habitsQuery.isLoading || entriesQuery.isLoading,
    error: habitsQuery.error ?? entriesQuery.error,
    refetch: () => {
      habitsQuery.refetch();
      entriesQuery.refetch();
    },
  };
}
