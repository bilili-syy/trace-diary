import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeProvider';
import { Layout, Typography, MOOD_OPTIONS } from '../constants';
import { DiaryEntry } from '../types';

interface MoodChartProps {
  entries: DiaryEntry[];
  days?: number;
}

export function MoodChart({ entries, days = 7 }: MoodChartProps) {
  const { colors } = useTheme();

  const chartData = useMemo(() => {
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days + 1);
    startDate.setHours(0, 0, 0, 0);

    const result: { date: string; mood: string | null; dayLabel: string }[] = [];
    const dayNames = ['日', '一', '二', '三', '四', '五', '六'];

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const entry = entries.find(e => e.id === dateStr);
      result.push({
        date: dateStr,
        mood: entry?.mood || null,
        dayLabel: dayNames[date.getDay()],
      });
    }

    return result;
  }, [entries, days]);

  const moodStats = useMemo(() => {
    const stats: Record<string, number> = {};
    entries.forEach(entry => {
      if (entry.mood) {
        stats[entry.mood] = (stats[entry.mood] || 0) + 1;
      }
    });
    return Object.entries(stats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
  }, [entries]);

  const totalMoodEntries = entries.filter(e => e.mood).length;

  return (
    <View style={[styles.container, { backgroundColor: colors.cardBackground }]}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>心情趋势</Text>
      
      <View style={styles.chartContainer}>
        {chartData.map((item, index) => (
          <View key={item.date} style={styles.chartItem}>
            <View style={[styles.moodDot, { backgroundColor: colors.inputBackground }]}>
              {item.mood ? (
                <Text style={styles.moodEmoji}>{item.mood}</Text>
              ) : (
                <View style={[styles.emptyDot, { backgroundColor: colors.border }]} />
              )}
            </View>
            <Text style={[styles.dayLabel, { color: colors.textMuted }]}>{item.dayLabel}</Text>
          </View>
        ))}
      </View>

      {moodStats.length > 0 && (
        <View style={[styles.statsContainer, { borderTopColor: colors.divider }]}>
          <Text style={[styles.statsTitle, { color: colors.textSecondary }]}>心情统计</Text>
          <View style={styles.statsRow}>
            {moodStats.map(([emoji, count]) => {
              const moodOption = MOOD_OPTIONS.find(m => m.emoji === emoji);
              const percentage = totalMoodEntries > 0 ? Math.round((count / totalMoodEntries) * 100) : 0;
              return (
                <View key={emoji} style={styles.statItem}>
                  <Text style={styles.statEmoji}>{emoji}</Text>
                  <View style={[styles.statBar, { backgroundColor: colors.inputBackground }]}>
                    <View 
                      style={[
                        styles.statBarFill, 
                        { backgroundColor: moodOption?.color || colors.primary, width: `${percentage}%` }
                      ]} 
                    />
                  </View>
                  <Text style={[styles.statCount, { color: colors.textMuted }]}>{count}次</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {moodStats.length === 0 && (
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
          记录心情后这里会显示统计数据
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Layout.borderRadius.lg,
    paddingVertical: Layout.spacing.md,
    paddingHorizontal: Layout.spacing.lg,
    marginTop: Layout.spacing.sm,
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Layout.spacing.md,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Layout.spacing.sm,
  },
  chartItem: {
    alignItems: 'center',
    flex: 1,
  },
  moodDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moodEmoji: {
    fontSize: 20,
  },
  emptyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dayLabel: {
    fontSize: Typography.fontSize.xs,
    marginTop: Layout.spacing.xs / 2,
  },
  statsContainer: {
    marginTop: Layout.spacing.md,
    paddingTop: Layout.spacing.md,
    borderTopWidth: 1,
  },
  statsTitle: {
    fontSize: Typography.fontSize.sm,
    marginBottom: Layout.spacing.sm,
  },
  statsRow: {
    gap: Layout.spacing.xs,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
  },
  statEmoji: {
    fontSize: Typography.fontSize.lg,
    width: 28,
  },
  statBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  statBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  statCount: {
    fontSize: Typography.fontSize.xs,
    width: 40,
    textAlign: 'right',
  },
  emptyText: {
    fontSize: Typography.fontSize.sm,
    textAlign: 'center',
    paddingVertical: Layout.spacing.md,
  },
});

export default MoodChart;
