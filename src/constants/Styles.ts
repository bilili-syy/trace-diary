import { StyleSheet, Platform } from 'react-native';
import Colors from './Colors';
import Layout, { Typography } from './Layout';
import type { TemplateQuestion } from '../types';

// 全局样式常量
export const GlobalStyles = StyleSheet.create({
  // 容器
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // 安全区域容器
  safeContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // 居中容器
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },

  // 卡片样式
  card: {
    backgroundColor: Colors.cardBackground,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.card.padding,
    marginHorizontal: Layout.card.marginHorizontal,
    marginVertical: Layout.card.marginVertical,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },

  // 标题文本
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },

  // 副标题
  subtitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },

  // 正文文本
  body: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    lineHeight: Math.round(Typography.fontSize.base * Typography.lineHeight.normal),
  },

  // 辅助文本
  caption: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },

  // 小文本
  small: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },

  // 输入框
  input: {
    backgroundColor: Colors.inputBackground,
    borderRadius: Layout.borderRadius.md,
    height: Layout.input.height,
    paddingHorizontal: Layout.input.paddingHorizontal,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  // 多行输入框
  textArea: {
    backgroundColor: Colors.inputBackground,
    borderRadius: Layout.borderRadius.md,
    padding: Layout.spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    textAlignVertical: 'top',
  },

  // 主按钮
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: Layout.borderRadius.md,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.lg,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },

  // 次要按钮
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: Layout.borderRadius.md,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.lg,
    borderWidth: 1,
    borderColor: Colors.primary,
  },

  secondaryButtonText: {
    color: Colors.primary,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },

  // 行容器
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // 分隔线
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: Layout.spacing.md,
  },

  // 阴影
  shadow: {
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
});

// 心情选项
export const MOOD_OPTIONS = [
  { emoji: '😊', label: '开心', color: Colors.moodColors['😊'] },
  { emoji: '😌', label: '平静', color: Colors.moodColors['😌'] },
  { emoji: '🥰', label: '幸福', color: Colors.moodColors['🥰'] },
  { emoji: '🤔', label: '思考', color: Colors.moodColors['🤔'] },
  { emoji: '😰', label: '焦虑', color: Colors.moodColors['😰'] },
  { emoji: '😢', label: '难过', color: Colors.moodColors['😢'] },
  { emoji: '😡', label: '生气', color: Colors.moodColors['😡'] },
  { emoji: '😴', label: '疲惫', color: Colors.moodColors['😴'] },
];

// 天气选项
export const WEATHER_OPTIONS = [
  { id: 'sunny', icon: 'sun', label: '晴天' },
  { id: 'cloudy', icon: 'cloud', label: '多云' },
  { id: 'rainy', icon: 'cloud-rain', label: '雨天' },
  { id: 'snowy', icon: 'cloud-snow', label: '雪天' },
  { id: 'windy', icon: 'wind', label: '大风' },
  { id: 'stormy', icon: 'cloud-lightning', label: '雷暴' },
];

export const DIARY_TEMPLATES = [
  {
    id: 'free',
    name: 'Free Writing',
    nameZh: '自由写作',
    questions: [] as TemplateQuestion[],
  },
  {
    id: 'daily-review',
    name: 'Daily Review',
    nameZh: '每日复盘',
    questions: [
      {
        question: '今天完成了什么？',
        placeholder: '比如：完成了项目汇报...',
        format: (answer: string) => `**今日完成**\n${answer}`,
      },
      {
        question: '今天学到了什么？',
        placeholder: '比如：学会了一个新技能...',
        format: (answer: string) => `**今日收获**\n${answer}`,
      },
      {
        question: '有什么可以改进的地方？',
        placeholder: '比如：时间管理可以更好...',
        format: (answer: string) => `**可以改进**\n${answer}`,
      },
      {
        question: '明天的计划是什么？',
        placeholder: '比如：完成报告、健身...',
        format: (answer: string) => `**明日计划**\n${answer}`,
      },
    ] as TemplateQuestion[],
  },
  {
    id: 'gratitude',
    name: 'Gratitude Journal',
    nameZh: '感恩日记',
    questions: [
      {
        question: '今天你感恩的三件事是什么？',
        placeholder: '1. ...\n2. ...\n3. ...',
        format: (answer: string) => `**感恩的事**\n${answer}`,
      },
      {
        question: '今天谁让你感到温暖？',
        placeholder: '比如：朋友、家人、陌生人...',
        format: (answer: string) => `**温暖的人**\n${answer}`,
      },
      {
        question: '今天有什么让你微笑的瞬间？',
        placeholder: '描述那个美好的瞬间...',
        format: (answer: string) => `**微笑瞬间**\n${answer}`,
      },
    ] as TemplateQuestion[],
  },
  {
    id: 'mood-tracker',
    name: 'Mood Tracker',
    nameZh: '情绪追踪',
    questions: [
      {
        question: '此刻你的心情如何？（1-10分）',
        placeholder: '输入1-10的数字',
        format: (answer: string) => `**心情指数**：${answer}分`,
      },
      {
        question: '是什么让你有这样的感受？',
        placeholder: '描述一下原因...',
        format: (answer: string) => `**原因**\n${answer}`,
      },
      {
        question: '你可以做什么来改善或保持这种状态？',
        placeholder: '比如：听音乐、运动、休息...',
        format: (answer: string) => `**行动计划**\n${answer}`,
      },
    ] as TemplateQuestion[],
  },
];

export default GlobalStyles;
