import { supabase, requireUserId } from '../lib/supabase';
import type { HabitEntry } from '../types';
import type { ISODate } from '../lib/date';

export async function entriesForDate(date: ISODate): Promise<HabitEntry[]> {
  const { data, error } = await supabase
    .from('habit_entries')
    .select('*')
    .eq('entry_date', date)
    .order('created_at');
  if (error) throw error;
  return data as HabitEntry[];
}

/** Every entry in an inclusive date range — the one query a report needs. */
export async function entriesInRange(from: ISODate, to: ISODate): Promise<HabitEntry[]> {
  const page = 1000;
  const out: HabitEntry[] = [];
  for (let offset = 0; ; offset += page) {
    const { data, error } = await supabase
      .from('habit_entries')
      .select('*')
      .gte('entry_date', from)
      .lte('entry_date', to)
      .order('entry_date')
      .range(offset, offset + page - 1);
    if (error) throw error;
    out.push(...(data as HabitEntry[]));
    if (!data || data.length < page) break;
  }
  return out;
}

/** Adds one session. Duration values are minutes; amount values are units. */
export async function addEntry(
  habit_id: string,
  entry_date: ISODate,
  value: number,
): Promise<HabitEntry> {
  const user_id = await requireUserId();
  const { data, error } = await supabase
    .from('habit_entries')
    .insert({ user_id, habit_id, entry_date, value })
    .select()
    .single();
  if (error) throw error;
  return data as HabitEntry;
}

export async function deleteEntry(id: string): Promise<void> {
  const { error } = await supabase.from('habit_entries').delete().eq('id', id);
  if (error) throw error;
}

/** Clears every session a habit has on one date. */
export async function clearDay(habit_id: string, entry_date: ISODate): Promise<void> {
  const { error } = await supabase
    .from('habit_entries')
    .delete()
    .eq('habit_id', habit_id)
    .eq('entry_date', entry_date);
  if (error) throw error;
}

/** Binary habits: a single row with value 1 means done, no row means not done. */
export async function setBinary(
  habit_id: string,
  entry_date: ISODate,
  done: boolean,
): Promise<void> {
  await clearDay(habit_id, entry_date);
  if (done) await addEntry(habit_id, entry_date, 1);
}
