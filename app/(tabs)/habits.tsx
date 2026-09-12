import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Empty, ErrorNote, Loading } from '../../src/components/ui';
import {
  useDeleteHabit,
  useHabits,
  useReorderHabits,
  useSetArchived,
} from '../../src/hooks/useHabits';
import { useAuth } from '../../src/hooks/useAuth';
import { formatMinutes, meta, unitLabel } from '../../src/categories';
import { effectiveTarget } from '../../src/metrics/aggregate';
import { colors, radius, space, type } from '../../src/lib/theme';
import type { Habit } from '../../src/types';

function subtitle(habit: Habit): string {
  const m = meta(habit.category);
  const t = effectiveTarget(habit);
  if (m.kind === 'binary') return m.label;
  if (t === null) return `${m.label} · no target`;
  const shown = m.kind === 'duration' ? formatMinutes(t) : `${t} ${unitLabel(habit.category, habit.unit)}`.trim();
  return `${m.label} · ${m.direction === 'up' ? '≥' : '≤'} ${shown}`;
}

export default function HabitsScreen() {
  const router = useRouter();
  const [showArchived, setShowArchived] = useState(false);
  const { data, isLoading, error } = useHabits(showArchived);
  const setArchived = useSetArchived();
  const remove = useDeleteHabit();
  const reorder = useReorderHabits();
  const { signOut } = useAuth();

  const habits = data ?? [];
  const active = habits.filter((h) => h.archived_at === null);

  function move(habit: Habit, delta: number) {
    const ids = active.map((h) => h.id);
    const i = ids.indexOf(habit.id);
    const j = i + delta;
    if (i < 0 || j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    reorder.mutate(ids);
  }

  function confirmDelete(habit: Habit) {
    Alert.alert(
      `Delete “${habit.name}”?`,
      'This also deletes every entry you have logged for it. Archiving keeps the history instead.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => remove.mutate(habit.id) },
      ],
    );
  }

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.body}>
      <ErrorNote error={error ?? setArchived.error ?? remove.error ?? reorder.error} />

      <Button label="+ New habit" onPress={() => router.push('/habit/new')} />

      {isLoading ? (
        <Loading />
      ) : habits.length === 0 ? (
        <Empty title="Nothing here yet" body="Create a habit to start tracking." />
      ) : (
        habits.map((habit) => {
          const archived = habit.archived_at !== null;
          const i = active.indexOf(habit);
          return (
            <View key={habit.id} style={[s.row, archived && { opacity: 0.55 }]}>
              <View style={[s.swatch, { backgroundColor: habit.color }]} />
              <Pressable style={{ flex: 1 }} onPress={() => router.push(`/habit/${habit.id}`)}>
                <Text style={type.heading}>{habit.name}</Text>
                <Text style={type.caption}>{archived ? `Archived · ${subtitle(habit)}` : subtitle(habit)}</Text>
              </Pressable>

              {!archived ? (
                <View style={s.moveCol}>
                  <Pressable
                    onPress={() => move(habit, -1)}
                    disabled={i <= 0}
                    hitSlop={6}
                    style={[s.moveBtn, i <= 0 && { opacity: 0.25 }]}
                  >
                    <Text style={s.moveText}>▲</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => move(habit, 1)}
                    disabled={i >= active.length - 1}
                    hitSlop={6}
                    style={[s.moveBtn, i >= active.length - 1 && { opacity: 0.25 }]}
                  >
                    <Text style={s.moveText}>▼</Text>
                  </Pressable>
                </View>
              ) : null}

              <View style={{ gap: space.xs }}>
                <Pressable
                  onPress={() => setArchived.mutate({ id: habit.id, archived: !archived })}
                  hitSlop={6}
                >
                  <Text style={s.action}>{archived ? 'Restore' : 'Archive'}</Text>
                </Pressable>
                <Pressable onPress={() => confirmDelete(habit)} hitSlop={6}>
                  <Text style={[s.action, { color: colors.bad }]}>Delete</Text>
                </Pressable>
              </View>
            </View>
          );
        })
      )}

      <Pressable onPress={() => setShowArchived((v) => !v)} style={{ paddingVertical: space.md }}>
        <Text style={[type.caption, { textAlign: 'center' }]}>
          {showArchived ? 'Hide archived habits' : 'Show archived habits'}
        </Text>
      </Pressable>

      <Button label="Sign out" variant="ghost" onPress={signOut} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  body: { padding: space.lg, gap: space.md, paddingBottom: space.xxl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
  },
  swatch: { width: 4, height: 36, borderRadius: 2 },
  moveCol: { gap: 2 },
  moveBtn: {
    width: 26,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 5,
  },
  moveText: { color: colors.textMuted, fontSize: 9 },
  action: { color: colors.accent, fontSize: 12, fontWeight: '600', textAlign: 'right' },
});
