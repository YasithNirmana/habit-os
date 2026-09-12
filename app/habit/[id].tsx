import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { Button, ErrorNote, Field } from '../../src/components/ui';
import { CATEGORIES, meta } from '../../src/categories';
import { useCreateHabit, useHabit, useUpdateHabit } from '../../src/hooks/useHabits';
import { colors, habitColors, radius, space, type } from '../../src/lib/theme';
import type { HabitCategory } from '../../src/types';

export default function HabitEditor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const isNew = id === 'new';
  const existing = useHabit(isNew ? undefined : id);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<HabitCategory>('one_time_positive');
  const [unit, setUnit] = useState('');
  const [target, setTarget] = useState('');
  const [color, setColor] = useState(habitColors[0]);

  const create = useCreateHabit();
  const update = useUpdateHabit();
  const busy = create.isPending || update.isPending;
  const m = meta(category);

  useEffect(() => {
    navigation.setOptions({ title: isNew ? 'New habit' : 'Edit habit' });
  }, [navigation, isNew]);

  // Populate once the habit list has loaded (a deep link can beat the query).
  useEffect(() => {
    if (!existing) return;
    setName(existing.name);
    setCategory(existing.category);
    setUnit(existing.unit ?? '');
    setTarget(existing.target_value === null ? '' : String(Number(existing.target_value)));
    setColor(existing.color);
  }, [existing]);

  const parsedTarget = target.trim() === '' ? null : Number(target.replace(',', '.'));
  const targetInvalid = parsedTarget !== null && (!Number.isFinite(parsedTarget) || parsedTarget < 0);
  const canSave = name.trim().length > 0 && !targetInvalid && (!m.needsUnit || unit.trim().length > 0);

  async function save() {
    const draft = {
      name: name.trim(),
      category,
      // Unit and target are meaningless outside their kinds; store null so a
      // category change never leaves a stale value behind.
      unit: m.needsUnit ? unit.trim() : null,
      target_value: m.targetLabel === null ? null : parsedTarget,
      color,
    };
    try {
      if (isNew) await create.mutateAsync(draft);
      else await update.mutateAsync({ id: id!, patch: draft });
      router.back();
    } catch {
      // Surfaced by ErrorNote below.
    }
  }

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
      <Field
        label="NAME"
        value={name}
        onChangeText={setName}
        placeholder={m.example}
        autoFocus={isNew}
        maxLength={80}
      />

      <View style={{ gap: space.sm }}>
        <Text style={type.label}>CATEGORY</Text>
        {CATEGORIES.map((c) => {
          const selected = c.category === category;
          return (
            <Pressable
              key={c.category}
              onPress={() => setCategory(c.category)}
              style={({ pressed }) => [
                s.option,
                selected && { borderColor: colors.accent, backgroundColor: 'rgba(79,142,247,0.10)' },
                pressed && { opacity: 0.8 },
              ]}
            >
              <View style={[s.radio, selected && { borderColor: colors.accent }]}>
                {selected ? <View style={s.radioDot} /> : null}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={type.body}>{c.label}</Text>
                <Text style={type.caption}>{c.blurb}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {m.needsUnit ? (
        <Field
          label="UNIT"
          value={unit}
          onChangeText={setUnit}
          placeholder="pages, cigarettes, g…"
          maxLength={16}
          autoCapitalize="none"
        />
      ) : null}

      {m.targetLabel ? (
        <Field
          label={m.targetLabel.toUpperCase()}
          value={target}
          onChangeText={setTarget}
          placeholder="optional"
          keyboardType="numeric"
          hint={`${m.targetHint} Leave blank to track the number without scoring it.`}
        />
      ) : null}

      <View style={{ gap: space.sm }}>
        <Text style={type.label}>COLOUR</Text>
        <View style={s.colorRow}>
          {habitColors.map((c) => (
            <Pressable
              key={c}
              onPress={() => setColor(c)}
              style={[s.color, { backgroundColor: c }, color === c && s.colorSelected]}
            />
          ))}
        </View>
      </View>

      <ErrorNote error={create.error ?? update.error} />

      <Button label={isNew ? 'Create habit' : 'Save changes'} onPress={save} disabled={!canSave} busy={busy} />
      <Button label="Cancel" variant="ghost" onPress={() => router.back()} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  body: { padding: space.lg, gap: space.xl, paddingBottom: space.xxl },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: space.md,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  color: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: 'transparent' },
  colorSelected: { borderColor: colors.text },
});
