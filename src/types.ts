export type HabitCategory =
  | 'one_time_positive'
  | 'one_time_negative'
  | 'time_positive'
  | 'time_negative'
  | 'amount_positive'
  | 'amount_negative';

/** What is being measured. */
export type HabitKind = 'binary' | 'duration' | 'amount';

/** Which way is better. */
export type HabitDirection = 'up' | 'down';

export type Habit = {
  id: string;
  user_id: string;
  name: string;
  category: HabitCategory;
  unit: string | null;
  target_value: number | null;
  color: string;
  sort_order: number;
  archived_at: string | null;
  created_at: string;
};

export type HabitEntry = {
  id: string;
  user_id: string;
  habit_id: string;
  /** ISO calendar date, `yyyy-MM-dd`, in the device's local timezone. */
  entry_date: string;
  value: number;
  created_at: string;
};

export type HabitDraft = {
  name: string;
  category: HabitCategory;
  unit: string | null;
  target_value: number | null;
  color: string;
};

export type DateRange = { from: string; to: string };
