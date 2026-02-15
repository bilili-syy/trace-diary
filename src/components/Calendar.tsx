import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import {
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  format, 
  addMonths, 
  subMonths,
  isSameMonth,
  isSameDay,
  getDay,
} from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { DiaryEntry } from '../types';
import { Colors, Layout, Typography } from '../constants';
import { useTheme } from '../context/ThemeProvider';
import { WEEKDAY_LABELS, formatDateId } from '../utils/dateUtils';

interface CalendarProps {
  entries: DiaryEntry[];
  onDateSelect: (date: Date) => void;
  selectedDate?: Date;
}

export function Calendar({ entries, onDateSelect, selectedDate }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { colors } = useTheme();

  const entryMap = useMemo(() => {
    const map = new Map<string, DiaryEntry>();
    entries.forEach((entry) => {
      map.set(entry.id, entry);
    });
    return map;
  }, [entries]);

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const firstDayOfWeek = getDay(startOfMonth(currentMonth));
  const emptyDays = Array(firstDayOfWeek).fill(null);

  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
    onDateSelect(new Date());
  };

  const renderDay = (day: Date | null, index: number) => {
    if (!day) {
      return <View key={`empty-${index}`} style={styles.dayCell} />;
    }

    const dateId = formatDateId(day);
    const entry = entryMap.get(dateId);
    const isToday = isSameDay(day, new Date());
    const isSelected = selectedDate && isSameDay(day, selectedDate);
    const hasEntry = !!entry;
    const moodColor = entry?.mood ? Colors.moodColors[entry.mood] : undefined;

    return (
      <TouchableOpacity
        key={dateId}
        style={[
          styles.dayCell,
          isToday && { backgroundColor: colors.primaryLight + '20', borderRadius: Layout.borderRadius.round },
          isSelected && { backgroundColor: colors.primary, borderRadius: Layout.borderRadius.round },
        ]}
        onPress={() => onDateSelect(day)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.dayText,
            { color: colors.textPrimary },
            isToday && { fontWeight: 'bold', color: colors.primary },
            isSelected && { color: '#FFFFFF', fontWeight: 'bold' },
          ]}
        >
          {format(day, 'd')}
        </Text>
        {hasEntry && (
          <View 
            style={[
              styles.moodIndicator, 
              { backgroundColor: moodColor || colors.primary }
            ]} 
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goToPreviousMonth} style={styles.navButton}>
          <Feather name="chevron-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={goToToday}>
          <Text style={[styles.monthTitle, { color: colors.textPrimary }]}>
            {format(currentMonth, 'yyyy年 M月', { locale: zhCN })}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
          <Feather name="chevron-right" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.weekdayRow}>
        {WEEKDAY_LABELS.map((label, index) => (
          <View key={index} style={styles.weekdayCell}>
            <Text style={[
              styles.weekdayText,
              { color: colors.textSecondary },
              (index === 0 || index === 6) && { color: colors.error },
            ]}>
              {label}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.daysGrid}>
        {[...emptyDays, ...days].map((day, index) => renderDay(day, index))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.md,
    marginHorizontal: Layout.spacing.md,
    marginTop: Layout.spacing.sm,
    marginBottom: Layout.spacing.xs,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.md,
  },
  navButton: {
    padding: Layout.spacing.sm,
  },
  monthTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: Layout.spacing.sm,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Layout.spacing.xs,
  },
  weekdayText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
  },
  dayText: {
    fontSize: Typography.fontSize.sm,
  },
  moodIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    position: 'absolute',
    bottom: 4,
  },
});

export default Calendar;
