export interface ThemeColors {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  background: string;
  cardBackground: string;
  inputBackground: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textLight: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  border: string;
  divider: string;
  shadow: string;
  tabBarBackground: string;
  tabBarActive: string;
  tabBarInactive: string;
}

export interface ThemePreset {
  id: string;
  name: string;
  colors: ThemeColors;
  darkColors: ThemeColors;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'garden',
    name: '花园绿',
    colors: {
      primary: '#5B8C5A',
      primaryLight: '#7BA87A',
      primaryDark: '#4A7249',
      background: '#F5F5F0',
      cardBackground: '#FFFFFF',
      inputBackground: '#FAFAF8',
      textPrimary: '#333333',
      textSecondary: '#666666',
      textMuted: '#999999',
      textLight: '#CCCCCC',
      success: '#5B8C5A',
      warning: '#E6A23C',
      error: '#F56C6C',
      info: '#409EFF',
      border: '#E8E8E4',
      divider: '#EEEEEA',
      shadow: '#000000',
      tabBarBackground: '#FFFFFF',
      tabBarActive: '#5B8C5A',
      tabBarInactive: '#999999',
    },
    darkColors: {
      primary: '#6FA06E',
      primaryLight: '#8FBF8E',
      primaryDark: '#5B8C5A',
      background: '#121212',
      cardBackground: '#1E1E1E',
      inputBackground: '#2A2A2A',
      textPrimary: '#E8E8E8',
      textSecondary: '#AAAAAA',
      textMuted: '#777777',
      textLight: '#555555',
      success: '#6FA06E',
      warning: '#E6A23C',
      error: '#F56C6C',
      info: '#409EFF',
      border: '#333333',
      divider: '#2A2A2A',
      shadow: '#000000',
      tabBarBackground: '#1E1E1E',
      tabBarActive: '#6FA06E',
      tabBarInactive: '#777777',
    },
  },
  {
    id: 'ocean',
    name: '海洋蓝',
    colors: {
      primary: '#4A90A4',
      primaryLight: '#6AAFC4',
      primaryDark: '#3A7284',
      background: '#F0F5F7',
      cardBackground: '#FFFFFF',
      inputBackground: '#F8FAFB',
      textPrimary: '#333333',
      textSecondary: '#666666',
      textMuted: '#999999',
      textLight: '#CCCCCC',
      success: '#52C41A',
      warning: '#FAAD14',
      error: '#FF4D4F',
      info: '#4A90A4',
      border: '#E4EAEC',
      divider: '#ECF0F2',
      shadow: '#000000',
      tabBarBackground: '#FFFFFF',
      tabBarActive: '#4A90A4',
      tabBarInactive: '#999999',
    },
    darkColors: {
      primary: '#5AA4B8',
      primaryLight: '#7AC0D4',
      primaryDark: '#4A90A4',
      background: '#121212',
      cardBackground: '#1E1E1E',
      inputBackground: '#2A2A2A',
      textPrimary: '#E8E8E8',
      textSecondary: '#AAAAAA',
      textMuted: '#777777',
      textLight: '#555555',
      success: '#52C41A',
      warning: '#FAAD14',
      error: '#FF4D4F',
      info: '#5AA4B8',
      border: '#333333',
      divider: '#2A2A2A',
      shadow: '#000000',
      tabBarBackground: '#1E1E1E',
      tabBarActive: '#5AA4B8',
      tabBarInactive: '#777777',
    },
  },
  {
    id: 'lavender',
    name: '薰衣草',
    colors: {
      primary: '#8B7CB6',
      primaryLight: '#A99CD0',
      primaryDark: '#6F5F9A',
      background: '#F5F3F8',
      cardBackground: '#FFFFFF',
      inputBackground: '#FAF9FC',
      textPrimary: '#333333',
      textSecondary: '#666666',
      textMuted: '#999999',
      textLight: '#CCCCCC',
      success: '#52C41A',
      warning: '#FAAD14',
      error: '#FF4D4F',
      info: '#8B7CB6',
      border: '#E8E4EE',
      divider: '#EEE8F2',
      shadow: '#000000',
      tabBarBackground: '#FFFFFF',
      tabBarActive: '#8B7CB6',
      tabBarInactive: '#999999',
    },
    darkColors: {
      primary: '#9B8CC6',
      primaryLight: '#B9ACDF',
      primaryDark: '#8B7CB6',
      background: '#121212',
      cardBackground: '#1E1E1E',
      inputBackground: '#2A2A2A',
      textPrimary: '#E8E8E8',
      textSecondary: '#AAAAAA',
      textMuted: '#777777',
      textLight: '#555555',
      success: '#52C41A',
      warning: '#FAAD14',
      error: '#FF4D4F',
      info: '#9B8CC6',
      border: '#333333',
      divider: '#2A2A2A',
      shadow: '#000000',
      tabBarBackground: '#1E1E1E',
      tabBarActive: '#9B8CC6',
      tabBarInactive: '#777777',
    },
  },
  {
    id: 'sunset',
    name: '日落橙',
    colors: {
      primary: '#D4764E',
      primaryLight: '#E8956E',
      primaryDark: '#B85E3A',
      background: '#FAF6F4',
      cardBackground: '#FFFFFF',
      inputBackground: '#FCFAF9',
      textPrimary: '#333333',
      textSecondary: '#666666',
      textMuted: '#999999',
      textLight: '#CCCCCC',
      success: '#52C41A',
      warning: '#D4764E',
      error: '#FF4D4F',
      info: '#409EFF',
      border: '#EEE8E4',
      divider: '#F2ECE8',
      shadow: '#000000',
      tabBarBackground: '#FFFFFF',
      tabBarActive: '#D4764E',
      tabBarInactive: '#999999',
    },
    darkColors: {
      primary: '#E4865E',
      primaryLight: '#F8A57E',
      primaryDark: '#D4764E',
      background: '#121212',
      cardBackground: '#1E1E1E',
      inputBackground: '#2A2A2A',
      textPrimary: '#E8E8E8',
      textSecondary: '#AAAAAA',
      textMuted: '#777777',
      textLight: '#555555',
      success: '#52C41A',
      warning: '#E4865E',
      error: '#FF4D4F',
      info: '#409EFF',
      border: '#333333',
      divider: '#2A2A2A',
      shadow: '#000000',
      tabBarBackground: '#1E1E1E',
      tabBarActive: '#E4865E',
      tabBarInactive: '#777777',
    },
  },
  {
    id: 'rose',
    name: '玫瑰粉',
    colors: {
      primary: '#C77B8B',
      primaryLight: '#DCA0AC',
      primaryDark: '#A66070',
      background: '#FAF5F6',
      cardBackground: '#FFFFFF',
      inputBackground: '#FCFAFB',
      textPrimary: '#333333',
      textSecondary: '#666666',
      textMuted: '#999999',
      textLight: '#CCCCCC',
      success: '#52C41A',
      warning: '#FAAD14',
      error: '#C77B8B',
      info: '#409EFF',
      border: '#F0E8EA',
      divider: '#F4ECEE',
      shadow: '#000000',
      tabBarBackground: '#FFFFFF',
      tabBarActive: '#C77B8B',
      tabBarInactive: '#999999',
    },
    darkColors: {
      primary: '#D78B9B',
      primaryLight: '#ECB0BC',
      primaryDark: '#C77B8B',
      background: '#121212',
      cardBackground: '#1E1E1E',
      inputBackground: '#2A2A2A',
      textPrimary: '#E8E8E8',
      textSecondary: '#AAAAAA',
      textMuted: '#777777',
      textLight: '#555555',
      success: '#52C41A',
      warning: '#FAAD14',
      error: '#D78B9B',
      info: '#409EFF',
      border: '#333333',
      divider: '#2A2A2A',
      shadow: '#000000',
      tabBarBackground: '#1E1E1E',
      tabBarActive: '#D78B9B',
      tabBarInactive: '#777777',
    },
  },
];

export const DEFAULT_THEME_ID = 'garden';

export const getThemeById = (id: string): ThemePreset => {
  return THEME_PRESETS.find((t) => t.id === id) || THEME_PRESETS[0];
};

const defaultTheme = getThemeById(DEFAULT_THEME_ID);

export const Colors = {
  primary: defaultTheme.colors.primary,
  primaryLight: defaultTheme.colors.primaryLight,
  primaryDark: defaultTheme.colors.primaryDark,
  background: defaultTheme.colors.background,
  cardBackground: defaultTheme.colors.cardBackground,
  inputBackground: defaultTheme.colors.inputBackground,
  textPrimary: defaultTheme.colors.textPrimary,
  textSecondary: defaultTheme.colors.textSecondary,
  textMuted: defaultTheme.colors.textMuted,
  textLight: defaultTheme.colors.textLight,
  success: defaultTheme.colors.success,
  warning: defaultTheme.colors.warning,
  error: defaultTheme.colors.error,
  info: defaultTheme.colors.info,
  border: defaultTheme.colors.border,
  divider: defaultTheme.colors.divider,
  shadow: defaultTheme.colors.shadow,

  moodColors: {
    '😊': '#FFD93D',
    '😢': '#6BCAFF',
    '😡': '#FF6B6B',
    '😌': '#98D89E',
    '😰': '#FFB366',
    '🥰': '#FF9ECD',
    '😴': '#B8A9E8',
    '🤔': '#87CEEB',
  } as Record<string, string>,

  weatherColors: {
    sunny: '#FFD93D',
    cloudy: '#B0C4DE',
    rainy: '#6BCAFF',
    snowy: '#E8E8E8',
    windy: '#87CEEB',
    stormy: '#708090',
  },

  tabBar: {
    background: defaultTheme.colors.tabBarBackground,
    active: defaultTheme.colors.tabBarActive,
    inactive: defaultTheme.colors.tabBarInactive,
  },
};

export default Colors;
