import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/habits';
import type { Habit, HabitDraft } from '../types';

export const habitKeys = {
  all: ['habits'] as const,
  list: (includeArchived: boolean) => ['habits', { includeArchived }] as const,
};

export function useHabits(includeArchived = false) {
  return useQuery({
    queryKey: habitKeys.list(includeArchived),
    queryFn: () => api.listHabits(includeArchived),
  });
}

export function useHabit(id: string | undefined) {
  const { data } = useHabits(true);
  return data?.find((h: Habit) => h.id === id);
}

/** Every habit mutation invalidates the same root key; the lists are tiny. */
function useHabitMutation<TArgs>(fn: (args: TArgs) => Promise<unknown>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => qc.invalidateQueries({ queryKey: habitKeys.all }),
  });
}

export const useCreateHabit = () => useHabitMutation((d: HabitDraft) => api.createHabit(d));

export const useUpdateHabit = () =>
  useHabitMutation(({ id, patch }: { id: string; patch: Partial<HabitDraft> }) =>
    api.updateHabit(id, patch),
  );

export const useSetArchived = () =>
  useHabitMutation(({ id, archived }: { id: string; archived: boolean }) =>
    api.setArchived(id, archived),
  );

export const useDeleteHabit = () => useHabitMutation((id: string) => api.deleteHabit(id));

export const useReorderHabits = () => useHabitMutation((ids: string[]) => api.reorderHabits(ids));
