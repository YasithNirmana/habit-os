-- Habit OS — initial schema
-- Run this in the Supabase SQL editor (or `supabase db push`).

-- ---------------------------------------------------------------- habits ----

create table if not exists public.habits (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  name         text not null check (length(btrim(name)) between 1 and 80),
  category     text not null check (category in (
                 'one_time_positive',
                 'one_time_negative',
                 'time_positive',
                 'time_negative',
                 'amount_positive',
                 'amount_negative'
               )),
  -- Unit label for amount habits ("pages", "cigarettes", "g"). Null for the
  -- binary and duration kinds, which carry their own implicit unit.
  unit         text check (unit is null or length(btrim(unit)) between 1 and 16),
  -- Optional daily target. Null means "track the raw number, do not score it".
  target_value numeric check (target_value is null or target_value >= 0),
  color        text not null default '#4F8EF7'
                 check (color ~ '^#[0-9A-Fa-f]{6}$'),
  sort_order   integer not null default 0,
  archived_at  timestamptz,
  created_at   timestamptz not null default now()
);

create index if not exists habits_user_order_idx
  on public.habits (user_id, sort_order, created_at);

-- --------------------------------------------------------- habit_entries ----
-- One row per *session*, not per day: three reading blocks on one date are
-- three rows, and the day's figure is always sum(value). Binary habits are the
-- degenerate case of a single row with value = 1.

create table if not exists public.habit_entries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  habit_id   uuid not null references public.habits (id) on delete cascade,
  -- Plain date, written by the client in the device's local timezone, so a
  -- late-night log never lands on tomorrow.
  entry_date date not null,
  value      numeric not null check (value >= 0),
  created_at timestamptz not null default now()
);

create index if not exists habit_entries_habit_date_idx
  on public.habit_entries (habit_id, entry_date);

create index if not exists habit_entries_user_date_idx
  on public.habit_entries (user_id, entry_date);

-- -------------------------------------------------------------------- RLS ---
-- Every row is reachable only by the user that owns it.

alter table public.habits        enable row level security;
alter table public.habit_entries enable row level security;

drop policy if exists habits_select on public.habits;
drop policy if exists habits_insert on public.habits;
drop policy if exists habits_update on public.habits;
drop policy if exists habits_delete on public.habits;

create policy habits_select on public.habits
  for select using (auth.uid() = user_id);
create policy habits_insert on public.habits
  for insert with check (auth.uid() = user_id);
create policy habits_update on public.habits
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy habits_delete on public.habits
  for delete using (auth.uid() = user_id);

drop policy if exists habit_entries_select on public.habit_entries;
drop policy if exists habit_entries_insert on public.habit_entries;
drop policy if exists habit_entries_update on public.habit_entries;
drop policy if exists habit_entries_delete on public.habit_entries;

create policy habit_entries_select on public.habit_entries
  for select using (auth.uid() = user_id);
create policy habit_entries_insert on public.habit_entries
  for insert with check (auth.uid() = user_id);
create policy habit_entries_update on public.habit_entries
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy habit_entries_delete on public.habit_entries
  for delete using (auth.uid() = user_id);
