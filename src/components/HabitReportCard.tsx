import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Chart } from '../charts/Chart';
import { buildChart, screenPalette } from '../charts/series';
import { meta } from '../categories';
import { stats, trendVerdict } from '../report/stats';
import { colors, radius, space, type } from '../lib/theme';
import type { HabitSummary } from '../metrics/aggregate';

export function HabitReportCard({ summary, width }: { summary: HabitSummary; width: number }) {
  const spec = buildChart(summary, { width, height: 150, palette: screenPalette });
  const verdict = trendVerdict(summary);
  const tone =
    verdict.tone === 'good' ? colors.good : verdict.tone === 'bad' ? colors.bad : colors.textMuted;

  return (
    <View style={s.card}>
      <View style={s.head}>
        <View style={[s.dot, { backgroundColor: summary.habit.color }]} />
        <Text style={[type.heading, { flex: 1 }]} numberOfLines={1}>
          {summary.habit.name}
        </Text>
        <Text style={type.caption}>{meta(summary.habit.category).label}</Text>
      </View>

      <Text style={[s.verdict, { color: tone }]}>{verdict.text}</Text>

      <Chart spec={spec} />

      <View style={s.stats}>
        {stats(summary).map((st) => (
          <View key={st.label} style={s.stat}>
            <Text style={s.statLabel}>{st.label.toUpperCase()}</Text>
            <Text style={s.statValue}>{st.value}</Text>
          </View>
        ))}
      </View>
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
    gap: space.sm,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  dot: { width: 9, height: 9, borderRadius: 5 },
  verdict: { fontSize: 13, fontWeight: '600' },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  stat: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    minWidth: 84,
  },
  statLabel: { color: colors.textFaint, fontSize: 9, fontWeight: '700', letterSpacing: 0.6 },
  statValue: { color: colors.text, fontSize: 15, fontWeight: '700' },
});
