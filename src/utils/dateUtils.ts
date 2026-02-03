import {
  format,
  parseISO,
  isSameDay,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  subYears,
  isValid,
} from 'date-fns';
import { zhCN } from 'date-fns/locale';

// 格式化日期为 YYYY-MM-DD 格式（用作 ID）
export const formatDateId = (date: Date | number): string => {
  const d = typeof date === 'number' ? new Date(date) : date;
  return format(d, 'yyyy-MM-dd');
};

// 格式化日期显示（中文）
export const formatDateDisplay = (date: Date | number): string => {
  const d = typeof date === 'number' ? new Date(date) : date;
  return format(d, 'yyyy年M月d日', { locale: zhCN });
};

// 格式化日期为短格式
export const formatDateShort = (date: Date | number): string => {
  const d = typeof date === 'number' ? new Date(date) : date;
  return format(d, 'M月d日', { locale: zhCN });
};

// 格式化星期
export const formatWeekday = (date: Date | number): string => {
  const d = typeof date === 'number' ? new Date(date) : date;
  return format(d, 'EEEE', { locale: zhCN });
};

// 格式化时间
export const formatTime = (date: Date | number): string => {
  const d = typeof date === 'number' ? new Date(date) : date;
  return format(d, 'HH:mm');
};

// 格式化完整日期时间
export const formatDateTime = (date: Date | number): string => {
  const d = typeof date === 'number' ? new Date(date) : date;
  return format(d, 'yyyy年M月d日 HH:mm', { locale: zhCN });
};

// 获取月份名称
export const getMonthName = (date: Date): string => {
  return format(date, 'yyyy年M月', { locale: zhCN });
};

// 判断是否为同一天
export const isSameDayCheck = (date1: Date | number, date2: Date | number): boolean => {
  const d1 = typeof date1 === 'number' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'number' ? new Date(date2) : date2;
  return isSameDay(d1, d2);
};

// 获取月份的所有日期
export const getMonthDays = (date: Date): Date[] => {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  return eachDayOfInterval({ start, end });
};

// 获取星期几（0-6，0为周日）
export const getDayOfWeek = (date: Date): number => {
  return getDay(date);
};

// 获取"那年今日"的日期（去年的今天）
export const getThisDayLastYears = (yearsBack: number = 5): Date[] => {
  const today = new Date();
  const dates: Date[] = [];
  for (let i = 1; i <= yearsBack; i++) {
    dates.push(subYears(today, i));
  }
  return dates;
};

// 解析日期字符串
export const parseDateString = (dateStr: string): Date | null => {
  try {
    const date = parseISO(dateStr);
    return isValid(date) ? date : null;
  } catch {
    return null;
  }
};

// 计算字数（中英文混合）
export const countWords = (text: string): number => {
  if (!text) return 0;
  const cleanText = text.replace(/\s+/g, '');
  const chineseChars = cleanText.match(/[\u4e00-\u9fa5]/g) || [];
  const englishWords = text.match(/[a-zA-Z]+/g) || [];
  return chineseChars.length + englishWords.length;
};

// 获取星期标题数组
export const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'];
