import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Chip } from './ui';
import {
  formatShort,
  fromISODate,
  monthStart,
  shiftDate,
  today,
  toISODate,
  type ISODate,
} from '../lib/date';
import { colors, radius, space, type } from '../lib/theme';

export type Preset = '7' | '30' | '90' | 'month' | 'custom';

export function presetRange(p: Exclude<Preset, 'custom'>): { from: ISODate; to: ISODate } {
  const to = today();
  if (p === 'month') return { from: monthStart(to), to };
  return { from: shiftDate(to, -(Number(p) - 1)), to };
}

export function RangePicker({
  preset,
  from,
  to,
  onChange,
}: {
  preset: Preset;
  from: ISODate;
  to: ISODate;
  onChange: (next: { preset: Preset; from: ISODate; to: ISODate }) => void;
}) {
  const [editing, setEditing] = useState<'from' | 'to' | null>(null);

  const choose = (p: Preset) => {
    if (p === 'custom') onChange({ preset: 'custom', from, to });
    else onChange({ preset: p, ...presetRange(p) });
  };

  function pick(value: Date | undefined) {
    const field = editing;
    setEditing(null);
    if (!value || !field) return;
    const picked = toISODate(value);
    // Keep the range ordered whichever end you dragged.
    const next =
      field === 'from'
        ? { from: picked, to: picked > to ? picked : to }
        : { from: picked < from ? picked : from, to: picked };
    onChange({ preset: 'custom', ...next });
  }

  return (
    <View style={{ gap: space.md }}>
      <View style={s.chips}>
        <Chip label="7 days" selected={preset === '7'} onPress={() => choose('7')} />
        <Chip label="30 days" selected={preset === '30'} onPress={() => choose('30')} />
        <Chip label="90 days" selected={preset === '90'} onPress={() => choose('90')} />
        <Chip label="This month" selected={preset === 'month'} onPress={() => choose('month')} />
        <Chip label="Custom" selected={preset === 'custom'} onPress={() => choose('custom')} />
      </View>

      {preset === 'custom' ? (
        <View style={s.customRow}>
          <Pressable style={s.dateBox} onPress={() => setEditing('from')}>
            <Text style={type.label}>FROM</Text>
            <Text style={type.body}>{formatShort(from)}</Text>
          </Pressable>
          <Text style={{ color: colors.textFaint }}>→</Text>
          <Pressable style={s.dateBox} onPress={() => setEditing('to')}>
            <Text style={type.label}>TO</Text>
            <Text style={type.body}>{formatShort(to)}</Text>
          </Pressable>
        </View>
      ) : null}

      {editing ? (
        <DateTimePicker
          value={fromISODate(editing === 'from' ? from : to)}
          mode="date"
          maximumDate={fromISODate(today())}
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={(event, value) => {
            if (event.type === 'dismissed') setEditing(null);
            else pick(value);
          }}
        />
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  customRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  dateBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: space.md,
    gap: 2,
  },
});
