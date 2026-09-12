# Habit OS

A personal daily habit tracker. Define your own habits, log them in a few taps each day, and pull a
charted report for any period you like — on screen or as a PDF.

**Stack:** Expo (React Native) + TypeScript · Supabase (Postgres + Auth) · TanStack Query ·
`react-native-svg` for charts · `expo-print` for the PDF.

---

## The six categories

Every habit is one of six kinds. Under the hood each collapses into *what is measured* (`kind`) and
*which way is better* (`direction`), which is why one set of charts and metrics serves all of them:

| Category | Measured as | Better when | A day counts as a hit when |
|---|---|---|---|
| One-time · good | done / not done | higher | you logged it |
| One-time · bad | done / not done | lower | you did **not** log it |
| Time spent · want more | minutes | higher | total ≥ your target |
| Time spent · want less | minutes | lower | total ≤ your ceiling |
| Amount · want more | your unit | higher | total ≥ your target |
| Amount · want less | your unit | lower | total ≤ your ceiling |

Targets are optional on the four measured categories — leave one blank to track the raw number
without scoring it. The two one-time categories always score, since "did it" and "stayed clean" are
targets in themselves.

Time and amount habits accept **as many sessions a day as you like**; the day's figure is their sum.

---

## Setup

### 1. Create the Supabase project

1. Make a free project at [supabase.com](https://supabase.com).
2. Open **SQL Editor**, paste the whole of [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql),
   and run it. This creates both tables and the row-level security policies that make your rows
   readable only by you.
3. Go to **Authentication → Users → Add user**, create your account with an email and password, and
   tick *Auto Confirm User*.
4. Go to **Authentication → Providers → Email** and turn **Allow new users to sign up** off, so the
   project stays a single-user app.

### 2. Point the app at it

```bash
cp .env.example .env
```

Fill in both values from **Project Settings → API**:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

`.env` is gitignored. Both values are safe in a client build — the anon key grants only what the RLS
policies above allow.

### 3. Run it

```bash
npm install
```

```bash
npx expo start
```

Install **Expo Go** from the Play Store, scan the QR code, and sign in with the account you created.
If the app says it needs its keys, restart the bundler with `npx expo start -c` so it picks up `.env`.

---

## Using it

**Today** is where you log. The ‹ › arrows move between days, so you can backfill yesterday; tapping
the date jumps back to today. One-time habits are a single tap. Time and amount habits take a number
and an **Add** — repeat it for each session, and long-press a session chip to remove a mistyped one.
The footer scores the day as *hits / habits with targets*.

**Habits** is where you add, edit, reorder (▲▼), archive and delete. Archiving keeps the history and
drops the habit off Today; deleting removes its entries too.

**Reports** takes any range — 7 / 30 / 90 days, this month, or a custom pair of dates — and gives you,
per habit, a chart with its target line, the headline numbers, streaks, and a verdict against the
equally long period immediately before it.

That verdict is **direction-aware**: cutting cigarettes from 40/day to 25/day reads as
*"Improving — down 38%"*, not as a red −38%. Progress means progress in the direction you chose for
that habit.

**Export PDF report** renders the range to an A4 PDF on the device and opens the share sheet, so it
can go to Drive, Files, email or anywhere else. The PDF draws from the same chart geometry as the
screen, so it always matches what you were looking at.

---

## Seeding test data

Reports are hard to judge on two days of data. This fills your account with ~90 days of plausible
history (and six sample habits, if you have none yet):

```bash
SEED_EMAIL=you@example.com SEED_PASSWORD=yourpassword node scripts/seed.mjs
```

`--days 30` changes the span; `--wipe` clears every entry first. It signs in as you and writes
through the same RLS policies the app uses — there is no service key anywhere in this project.

---

## Layout

```
app/                    screens (expo-router)
  (tabs)/index.tsx      Today — daily logging
  (tabs)/habits.tsx     manage habits
  (tabs)/reports.tsx    range picker, charts, PDF export
  habit/[id].tsx        habit editor ("new" to create)
src/
  categories.ts         the six categories — kind, direction, labels, input rules
  metrics/aggregate.ts  daily totals, hit/miss, streaks, direction-aware trends
  charts/series.ts      chart geometry, computed once
  charts/Chart.tsx      …rendered to react-native-svg on screen
  charts/toSvg.ts       …and to an SVG string for the PDF
  report/               stats formatting, the report HTML, the PDF export
  api/ hooks/           Supabase queries and their TanStack Query wrappers
supabase/migrations/    the schema and RLS policies
scripts/seed.mjs        dev-only sample data
```

`categories.ts` is the file to touch if you ever want a seventh category — the screens, metrics and
charts all read their behaviour from it rather than switching on category names.

Type-check with `npm run typecheck`.
