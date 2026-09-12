import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Empty, ErrorNote, Loading } from '../../src/components/ui';
import { HabitReportCard } from '../../src/components/HabitReportCard';
import { presetRange, RangePicker, type Preset } from '../../src/components/RangePicker';
import { useReport } from '../../src/hooks/useRangeReport';
import { exportPdf } from '../../src/report/exportPdf';
import { overall } from '../../src/report/stats';
import { daysBetween, formatShort } from '../../src/lib/date';
import { colors, radius, space, type } from '../../src/lib/theme';

export default function ReportsScreen() {
  const { width } = useWindowDimensions();
  const [preset, setPreset] = useState<Preset>('30');
  const [range, setRange] = useState(() => presetRange('30'));
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<unknown>(null);

  const { report, isLoading, error } = useReport(range.from, range.to);
  const chartWidth = Math.max(240, width - space.lg * 2 - space.lg * 2);
  const o = useMemo(() => (report ? overall(report.summaries) : null), [report]);

  async function onExport() {
    if (!report) return;
    setExporting(true);
    setExportError(null);
    try {
      await exportPdf(report);
    } catch (e) {
      setExportError(e);
      Alert.alert('Export failed', e instanceof Error ? e.message : String(e));
    } finally {
      setExporting(false);
    }
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={s.body}>
        <Text style={type.display}>Reports</Text>

        <RangePicker
          preset={preset}
          from={range.from}
          to={range.to}
          onChange={(next) => {
            setPreset(next.preset);
            setRange({ from: next.from, to: next.to });
          }}
        />

        <Text style={type.caption}>
          {formatShort(range.from)} → {formatShort(range.to)} ·{' '}
          {daysBetween(range.from, range.to) + 1} days
        </Text>

        <ErrorNote error={error ?? exportError} />

        {isLoading ? (
          <Loading />
        ) : !report || report.summaries.length === 0 ? (
          <Empty
            title="Nothing to report yet"
            body="Add a habit and log a few days, then come back here."
          />
        ) : (
          <>
            {o ? (
              <View style={s.overall}>
                <Stat label="HABITS" value={String(o.habits)} />
                <Stat
                  label="HIT RATE"
                  value={o.hitRate === null ? '—' : `${o.hitRate.toFixed(0)}%`}
                />
                <Stat label="IMPROVING" value={String(o.improving)} tint={colors.good} />
                <Stat label="SLIPPING" value={String(o.slipping)} tint={colors.bad} />
              </View>
            ) : null}

            <Button
              label="Export PDF report"
              onPress={onExport}
              busy={exporting}
              variant="secondary"
            />

            {report.summaries.map((summary) => (
              <HabitReportCard key={summary.habit.id} summary={summary} width={chartWidth} />
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value, tint }: { label: string; value: string; tint?: string }) {
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <Text style={s.overallLabel}>{label}</Text>
      <Text style={[s.overallValue, tint ? { color: tint } : null]}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { padding: space.lg, gap: space.lg, paddingBottom: space.xxl },
  overall: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    gap: space.sm,
  },
  overallLabel: { color: colors.textFaint, fontSize: 9, fontWeight: '700', letterSpacing: 0.6 },
  overallValue: { color: colors.text, fontSize: 20, fontWeight: '800' },
});
