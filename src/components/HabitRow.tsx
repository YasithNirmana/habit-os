import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { formatMinutes, kindOf, meta, unitLabel } from '../categories';
import { effectiveTarget, isHit } from '../metrics/aggregate';
import { colors, radius, space, type } from '../lib/theme';
import type { Habit, HabitEntry } from '../types';

type Props = {
  habit: Habit;
  entries: HabitEntry[];
  onToggle: (done: boolean) => void;
  onAdd: (value: number) => void;
  onDeleteEntry: (id: string) => void;
};

function TargetPip({ habit, total }: { habit: Habit; total: number }) {
  const hit = isHit(habit, total);
  if (hit === null) return null;
  return (
    <View
      style={[
        s.pip,
        { backgroundColor: hit ? colors.good : colors.surfaceAlt, borderColor: hit ? colors.good : colors.border },
      ]}
    >
      <Text style={{ fontSize: 11, fontWeight: '700', color: hit ? '#06281A' : colors.textFaint }}>
        {hit ? 'HIT' : 'MISS'}
      </Text>
    </View>
  );
}

function targetCaption(habit: Habit): string | null {
  const t = effectiveTarget(habit);
  if (t === null) return 'No target — tracking only';
  const k = kindOf(habit.category);
  if (k === 'binary') return meta(habit.category).direction === 'up' ? 'Do it daily' : 'Avoid daily';
  const shown = k === 'duration' ? formatMinutes(t) : `${t} ${unitLabel(habit.category, habit.unit)}`.trim();
  return meta(habit.category).direction === 'up' ? `Target ≥ ${shown}` : `Keep ≤ ${shown}`;
}

export function HabitRow({ habit, entries, onToggle, onAdd, onDeleteEntry }: Props) {
  const [draft, setDraft] = useState('');
  const kind = kindOf(habit.category);
  const total = entries.reduce((a, e) => a + Number(e.value), 0);
  const unit = unitLabel(habit.category, habit.unit);

  function commit() {
    const n = Number(draft.replace(',', '.'));
    if (!Number.isFinite(n) || n <= 0) {
      setDraft('');
      return;
    }
    onAdd(n);
    setDraft('');
  }

  // ------------------------------------------------------------- binary ----
  if (kind === 'binary') {
    const done = total > 0;
    const wantsIt = meta(habit.category).direction === 'up';
    // For a habit you are trying to avoid, "logged" means you slipped.
    const tint = done ? (wantsIt ? colors.good : colors.bad) : colors.border;
    return (
      <Pressable
        onPress={() => onToggle(!done)}
        style={({ pressed }) => [s.card, pressed && { opacity: 0.8 }]}
      >
        <View style={s.headRow}>
          <View style={[s.swatch, { backgroundColor: habit.color }]} />
          <View style={{ flex: 1 }}>
            <Text style={type.heading}>{habit.name}</Text>
            <Text style={type.caption}>{targetCaption(habit)}</Text>
          </View>
          <View style={[s.checkbox, { borderColor: tint, backgroundColor: done ? tint : 'transparent' }]}>
            {done ? <Text style={s.checkMark}>{wantsIt ? '✓' : '✕'}</Text> : null}
          </View>
        </View>
      </Pressable>
    );
  }

  // -------------------------------------------------- duration / amount ----
  const shownTotal = kind === 'duration' ? formatMinutes(total) : `${total}${unit ? ` ${unit}` : ''}`;
  return (
    <View style={s.card}>
      <View style={s.headRow}>
        <View style={[s.swatch, { backgroundColor: habit.color }]} />
        <View style={{ flex: 1 }}>
          <Text style={type.heading}>{habit.name}</Text>
          <Text style={type.caption}>{targetCaption(habit)}</Text>
        </View>
        <TargetPip habit={habit} total={total} />
      </View>

      <View style={s.totalRow}>
        <Text style={s.total}>{total > 0 ? shownTotal : '—'}</Text>
        <View style={s.adder}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            keyboardType="numeric"
            placeholder={kind === 'duration' ? 'minutes' : unit || 'amount'}
            placeholderTextColor={colors.textFaint}
            style={s.adderInput}
            onSubmitEditing={commit}
            returnKeyType="done"
          />
          <Pressable
            onPress={commit}
            disabled={draft.trim() === ''}
            style={({ pressed }) => [
              s.addBtn,
              draft.trim() === '' && { opacity: 0.4 },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={s.addBtnLabel}>Add</Text>
          </Pressable>
        </View>
      </View>

      {entries.length > 0 ? (
        <View style={s.sessions}>
          {entries.map((e) => (
            <Pressable
              key={e.id}
              onLongPress={() => onDeleteEntry(e.id)}
              style={({ pressed }) => [s.session, pressed && { opacity: 0.6 }]}
            >
              <Text style={s.sessionText}>
                {kind === 'duration' ? formatMinutes(Number(e.value)) : String(Number(e.value))}
              </Text>
              <Text style={s.sessionX}>✕</Text>
            </Pressable>
          ))}
          <Text style={[type.caption, { alignSelf: 'center' }]}>
            {entries.length > 1 ? `${entries.length} sessions · ` : ''}hold to remove
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    gap: space.md,
  },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  swatch: { width: 4, height: 34, borderRadius: 2 },
  checkbox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: { color: '#06281A', fontSize: 16, fontWeight: '900' },
  pip: { paddingHorizontal: space.sm, paddingVertical: 3, borderRadius: radius.pill, borderWidth: 1 },
  totalRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  total: { fontSize: 24, fontWeight: '700', color: colors.text, minWidth: 84 },
  adder: { flexDirection: 'row', flex: 1, gap: space.sm },
  adderInput: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    color: colors.text,
    fontSize: 15,
  },
  addBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    justifyContent: 'center',
  },
  addBtnLabel: { color: colors.onAccent, fontWeight: '700', fontSize: 14 },
  sessions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  session: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    paddingHorizontal: space.md,
    paddingVertical: 5,
  },
  sessionText: { color: colors.text, fontSize: 13, fontWeight: '600' },
  sessionX: { color: colors.textFaint, fontSize: 11 },
});
