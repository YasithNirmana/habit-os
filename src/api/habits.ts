import { supabase, requireUserId } from '../lib/supabase';
import type { Habit, HabitDraft } from '../types';

export async function listHabits(includeArchived = false): Promise<Habit[]> {
  let q = supabase.from('habits').select('*').order('sort_order').order('created_at');
  if (!includeArchived) q = q.is('archived_at', null);
  const { data, error } = await q;
  if (error) throw error;
  return data as Habit[];
}

export async function createHabit(draft: HabitDraft): Promise<Habit> {
  const user_id = await requireUserId();
  // Append to the end of the list.
  const { data: last } = await supabase
    .from('habits')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1);
  const sort_order = (last?.[0]?.sort_order ?? -1) + 1;

  const { data, error } = await supabase
    .from('habits')
    .insert({ ...draft, user_id, sort_order })
    .select()
    .single();
  if (error) throw error;
  return data as Habit;
}

export async function updateHabit(id: string, patch: Partial<HabitDraft>): Promise<Habit> {
  const { data, error } = await supabase
    .from('habits')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Habit;
}

export async function setArchived(id: string, archived: boolean): Promise<void> {
  const { error } = await supabase
    .from('habits')
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq('id', id);
  if (error) throw error;
}

/** Permanently removes the habit and, by cascade, all of its entries. */
export async function deleteHabit(id: string): Promise<void> {
  const { error } = await supabase.from('habits').delete().eq('id', id);
  if (error) throw error;
}

/** Persists a new ordering; `ids` is the full list in its new order. */
export async function reorderHabits(ids: string[]): Promise<void> {
  const user_id = await requireUserId();
  const rows = ids.map((id, i) => ({ id, user_id, sort_order: i }));
  // `upsert` needs every not-null column, so patch one at a time instead.
  await Promise.all(
    rows.map(({ id, sort_order }) =>
      supabase.from('habits').update({ sort_order }).eq('id', id),
    ),
  );
}
