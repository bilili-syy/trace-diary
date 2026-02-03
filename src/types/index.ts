// 日记条目数据结构
export interface DiaryEntry {
  id: string; // 日期字符串 'YYYY-MM-DD'
  date: number; // 时间戳
  content: string; // Markdown 格式的日记内容
  mood?: string; // Emoji 字符, e.g., '😊'
  weather?: string; // 天气标识, e.g., 'sunny'
  templateUsed?: string; // e.g., 'daily-review'
  wordCount: number;
  images?: string[]; // 图片文件名数组 (存储在 documentDirectory/diary-images/)
  tags?: string[]; // 标签数组
  imageBase64?: string | null; // @deprecated 兼容旧数据
}

// 标签
export interface Tag {
  id: string;
  name: string;
  color: string;
}

// 应用设置
export interface AppSettings {
  isAppLockEnabled: boolean;
  pinHash?: string;
  theme: 'light' | 'dark';
  lastBackupDate?: number;
  dailyReminder?: {
    enabled: boolean;
    hour: number;
    minute: number;
  };
  writingGoal?: number; // 每日字数目标
}

// 日记模板问题
export interface TemplateQuestion {
  question: string;
  placeholder: string;
  format: (answer: string) => string;
}

// 日记模板
export interface DiaryTemplate {
  id: string;
  name: string;
  nameZh: string;
  questions: TemplateQuestion[];
}

// 天气类型
export type WeatherType = 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'windy' | 'stormy';

// 心情选项
export interface MoodOption {
  emoji: string;
  label: string;
  color: string;
}

// 日记状态 Action 类型
export type DiaryAction =
  | { type: 'SET_ENTRIES'; payload: DiaryEntry[] }
  | { type: 'ADD_ENTRY'; payload: DiaryEntry }
  | { type: 'UPDATE_ENTRY'; payload: DiaryEntry }
  | { type: 'DELETE_ENTRY'; payload: string }
  | { type: 'IMPORT_ENTRIES'; payload: { entries: DiaryEntry[]; mode: 'merge' | 'overwrite' } };

// 认证状态
export interface AuthState {
  isAuthenticated: boolean;
  isAppLockEnabled: boolean;
  biometricAvailable: boolean;
}

// 导航参数类型
export type RootStackParamList = {
  Main: undefined;
  Editor: { entryId?: string; date?: string };
  DiaryDetail: { entryId: string };
};

export type MainTabParamList = {
  Home: undefined;
  Calendar: undefined;
  Settings: undefined;
};

// 导出/导入数据结构
export interface ExportData {
  version: string;
  exportDate: number;
  entries: DiaryEntry[];
}
