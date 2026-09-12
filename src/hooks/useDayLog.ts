import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/entries';
import type { ISODate } from '../lib/date';

export const dayKeys = {
  all: ['entries'] as const,
  day: (date: ISODate) => ['entries', 'day', date] as const,
  range: (from: ISODate, to: ISODate) => ['entries', 'range', from, to] as const,
};

export function useDayEntries(date: ISODate) {
  return useQuery({
    queryKey: dayKeys.day(date),
    queryFn: () => api.entriesForDate(date),
  });
}

/**
 * Logging invalidates every entry query: the day being edited is also inside
 * whatever report range is open, and reports must not go stale behind a tab.
 */
function useEntryMutation<TArgs>(fn: (args: TArgs) => Promise<unknown>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => qc.invalidateQueries({ queryKey: dayKeys.all }),
  });
}

export const useAddEntry = () =>
  useEntryMutation(({ habitId, date, value }: { habitId: string; date: ISODate; value: number }) =>
    api.addEntry(habitId, date, value),
  );

export const useDeleteEntry = () => useEntryMutation((id: string) => api.deleteEntry(id));

export const useSetBinary = () =>
  useEntryMutation(({ habitId, date, done }: { habitId: string; date: ISODate; done: boolean }) =>
    api.setBinary(habitId, date, done),
  );

export const useClearDay = () =>
  useEntryMutation(({ habitId, date }: { habitId: string; date: ISODate }) =>
    api.clearDay(habitId, date),
  );
