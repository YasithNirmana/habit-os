import React, { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Button, Empty, ErrorNote, Loading } from '../../src/components/ui';
import { HabitRow } from '../../src/components/HabitRow';
import { useHabits } from '../../src/hooks/useHabits';
import {
  useAddEntry,
  useDayEntries,
  useDeleteEntry,
  useSetBinary,
} from '../../src/hooks/useDayLog';
import { dayScore, totalsByHabit } from '../../src/metrics/aggregate';
import { relativeDayLabel, shiftDate, today, formatDayLong, daysBetween } from '../../src/lib/date';
import { colors, radius, space, type } from '../../src/lib/theme';

export default function TodayScreen() {
  const router = useRouter();
  const [date, setDate] = useState(today());
  const habitsQuery = useHabits();
  const entriesQuery = useDayEntries(date);
  const addEntry = useAddEntry();
  const deleteEntry = useDeleteEntry();
  const setBinary = useSetBinary();

  const habits = habitsQuery.data ?? [];
  const entries = useMemo(() => entriesQuery.data ?? [], [entriesQuery.data]);
  const score = dayScore(habits, totalsByHabit(entries));
  const isFuture = daysBetween(today(), date) > 0;

  const mutationError = addEntry.error ?? deleteEntry.error ?? setBinary.error;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Pressable onPress={() => setDate(shiftDate(date, -1))} hitSlop={12} style={s.arrow}>
          <Text style={s.arrowText}>‹</Text>
        </Pressable>
        <Pressable onPress={() => setDate(today())} style={{ flex: 1, alignItems: 'center' }}>
          <Text style={type.title}>{relativeDayLabel(date)}</Text>
          <Text style={type.caption}>{formatDayLong(date)}</Text>
        </Pressable>
        <Pressable
          onPress={() => setDate(shiftDate(date, 1))}
          hitSlop={12}
          disabled={isFuture}
          style={[s.arrow, isFuture && { opacity: 0.25 }]}
        >
          <Text style={s.arrowText}>›</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={s.body}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={entriesQuery.isFetching && !entriesQuery.isLoading}
            onRefresh={() => entriesQuery.refetch()}
            tintColor={colors.textMuted}
          />
        }
      >
        <ErrorNote error={habitsQuery.error ?? entriesQuery.error ?? mutationError} />

        {habitsQuery.isLoading || entriesQuery.isLoading ? (
          <Loading />
        ) : habits.length === 0 ? (
          <View style={{ gap: space.lg }}>
            <Empty
              title="No habits yet"
              body="Add the things you want to do more of — and the ones you want to do less of."
            />
            <Button label="Create your first habit" onPress={() => router.push('/habit/new')} />
          </View>
        ) : (
          <>
            {habits.map((habit) => (
              <HabitRow
                key={habit.id}
                habit={habit}
                entries={entries.filter((e) => e.habit_id === habit.id)}
                onToggle={(done) => setBinary.mutate({ habitId: habit.id, date, done })}
                onAdd={(value) => addEntry.mutate({ habitId: habit.id, date, value })}
                onDeleteEntry={(id) => deleteEntry.mutate(id)}
              />
            ))}

            {score.scored > 0 ? (
              <View style={s.score}>
                <Text style={type.label}>DAY SCORE</Text>
                <Text style={s.scoreValue}>
                  {score.hits}
                  <Text style={{ color: colors.textFaint }}>/{score.scored}</Text>
                </Text>
                <View style={s.scoreTrack}>
                  <View
                    style={[
                      s.scoreFill,
                      { width: `${(score.hits / score.scored) * 100}%` },
                    ]}
                  />
                </View>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    gap: space.md,
  },
  arrow: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  arrowText: { color: colors.text, fontSize: 24, lineHeight: 28, fontWeight: '600' },
  body: { padding: space.lg, paddingTop: 0, gap: space.md, paddingBottom: space.xxl },
  score: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    gap: space.sm,
    marginTop: space.sm,
  },
  scoreValue: { fontSize: 28, fontWeight: '800', color: colors.text },
  scoreTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
  },
  scoreFill: { height: 6, borderRadius: 3, backgroundColor: colors.good },
});
