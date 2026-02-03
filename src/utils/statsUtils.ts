import { DiaryEntry } from '../types';
import { formatDateId } from './dateUtils';

export interface WritingStats {
  totalEntries: number;
  totalWords: number;
  currentStreak: number;
  longestStreak: number;
  thisMonthEntries: number;
  thisMonthWords: number;
  averageWordsPerEntry: number;
}

export const calculateStreak = (entries: DiaryEntry[]): { current: number; longest: number } => {
  if (entries.length === 0) return { current: 0, longest: 0 };

  const sortedEntries = [...entries].sort((a, b) => b.date - a.date);
  const dateSet = new Set(sortedEntries.map((e) => e.id));

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const checkDate = new Date(today);
  
  const todayId = formatDateId(today);
  if (!dateSet.has(todayId)) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  for (let i = 0; i < 365; i++) {
    const dateId = formatDateId(checkDate);
    if (dateSet.has(dateId)) {
      tempStreak++;
      if (i === 0 || currentStreak > 0) {
        currentStreak = tempStreak;
      }
    } else {
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
      if (currentStreak === tempStreak) {
        break;
      }
      tempStreak = 0;
    }
    checkDate.setDate(checkDate.getDate() - 1);
  }

  if (tempStreak > longestStreak) {
    longestStreak = tempStreak;
  }

  return { current: currentStreak, longest: longestStreak };
};

export const getWritingStats = (entries: DiaryEntry[]): WritingStats => {
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const thisMonthEntries = entries.filter((e) => {
    const d = new Date(e.date);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });

  const totalWords = entries.reduce((sum, e) => sum + e.wordCount, 0);
  const thisMonthWords = thisMonthEntries.reduce((sum, e) => sum + e.wordCount, 0);
  const { current, longest } = calculateStreak(entries);

  return {
    totalEntries: entries.length,
    totalWords,
    currentStreak: current,
    longestStreak: longest,
    thisMonthEntries: thisMonthEntries.length,
    thisMonthWords,
    averageWordsPerEntry: entries.length > 0 ? Math.round(totalWords / entries.length) : 0,
  };
};

export const getHeatmapData = (
  entries: DiaryEntry[],
  year: number
): Map<string, { count: number; wordCount: number }> => {
  const map = new Map<string, { count: number; wordCount: number }>();

  entries.forEach((entry) => {
    const d = new Date(entry.date);
    if (d.getFullYear() === year) {
      map.set(entry.id, { count: 1, wordCount: entry.wordCount });
    }
  });

  return map;
};
