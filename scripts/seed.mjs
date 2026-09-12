/**
 * Dev-only: fills your account with ~90 days of plausible data so the Reports
 * screen has something to draw before you have tracked for three months.
 *
 *   node scripts/seed.mjs            # add sample habits if none, then 90 days
 *   node scripts/seed.mjs --days 30
 *   node scripts/seed.mjs --wipe     # delete all entries first
 *
 * Credentials come from .env plus SEED_EMAIL / SEED_PASSWORD (your sign-in).
 */
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

function loadEnv(file) {
  try {
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch {
    /* no .env — rely on the real environment */
  }
}
loadEnv('.env');

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const email = process.env.SEED_EMAIL;
const password = process.env.SEED_PASSWORD;

if (!url || !key) {
  console.error('Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}
if (!email || !password) {
  console.error('Set SEED_EMAIL and SEED_PASSWORD (your Habit OS sign-in) and run again.');
  process.exit(1);
}

const args = process.argv.slice(2);
const days = Number(args[args.indexOf('--days') + 1]) || 90;
const wipe = args.includes('--wipe');

const supabase = createClient(url, key, { auth: { persistSession: false } });

const SAMPLES = [
  { name: 'Made the bed', category: 'one_time_positive', unit: null, target_value: null, color: '#3DD68C' },
  { name: 'Skipped breakfast', category: 'one_time_negative', unit: null, target_value: null, color: '#F2555A' },
  { name: 'Deep work', category: 'time_positive', unit: null, target_value: 120, color: '#4F8EF7' },
  { name: 'Doomscrolling', category: 'time_negative', unit: null, target_value: 45, color: '#F5A524' },
  { name: 'Pages read', category: 'amount_positive', unit: 'pages', target_value: 20, color: '#A78BFA' },
  { name: 'Cigarettes', category: 'amount_negative', unit: 'cigarettes', target_value: 3, color: '#FB7185' },
];

const iso = (d) => d.toISOString().slice(0, 10);

/** Random walk with a gentle drift, so the trend arrows have something to say. */
function value(sample, dayIndex, total) {
  const progress = dayIndex / Math.max(1, total - 1);
  const jitter = () => (Math.random() - 0.5) * 2;
  switch (sample.category) {
    case 'one_time_positive':
      return Math.random() < 0.55 + progress * 0.3 ? 1 : 0;
    case 'one_time_negative':
      return Math.random() < 0.35 - progress * 0.2 ? 1 : 0;
    case 'time_positive':
      return Math.max(0, Math.round(70 + progress * 70 + jitter() * 40));
    case 'time_negative':
      return Math.max(0, Math.round(90 - progress * 50 + jitter() * 25));
    case 'amount_positive':
      return Math.max(0, Math.round(10 + progress * 18 + jitter() * 8));
    case 'amount_negative':
      return Math.max(0, Math.round(8 - progress * 6 + jitter() * 3));
    default:
      return 0;
  }
}

const { data: auth, error: authError } = await supabase.auth.signInWithPassword({ email, password });
if (authError) {
  console.error('Sign-in failed:', authError.message);
  process.exit(1);
}
const userId = auth.user.id;
console.log(`Signed in as ${email}`);

if (wipe) {
  const { error } = await supabase.from('habit_entries').delete().eq('user_id', userId);
  if (error) throw error;
  console.log('Wiped every entry.');
}

let { data: habits, error: listError } = await supabase.from('habits').select('*');
if (listError) throw listError;

if (habits.length === 0) {
  const rows = SAMPLES.map((sample, i) => ({ ...sample, user_id: userId, sort_order: i }));
  const { data, error } = await supabase.from('habits').insert(rows).select();
  if (error) throw error;
  habits = data;
  console.log(`Created ${habits.length} sample habits.`);
} else {
  console.log(`Using your ${habits.length} existing habits.`);
}

const start = new Date();
start.setDate(start.getDate() - (days - 1));

const entries = [];
for (let i = 0; i < days; i += 1) {
  const d = new Date(start);
  d.setDate(start.getDate() + i);
  for (const habit of habits) {
    const v = value(habit, i, days);
    if (v <= 0) continue;
    // Split larger figures into two sessions now and then, exercising the
    // multiple-sessions-per-day path.
    if (v > 20 && Math.random() < 0.35) {
      const first = Math.round(v * 0.4);
      entries.push({ user_id: userId, habit_id: habit.id, entry_date: iso(d), value: first });
      entries.push({ user_id: userId, habit_id: habit.id, entry_date: iso(d), value: v - first });
    } else {
      entries.push({ user_id: userId, habit_id: habit.id, entry_date: iso(d), value: v });
    }
  }
}

for (let i = 0; i < entries.length; i += 500) {
  const { error } = await supabase.from('habit_entries').insert(entries.slice(i, i + 500));
  if (error) throw error;
}

console.log(`Inserted ${entries.length} entries across ${days} days.`);
await supabase.auth.signOut();
