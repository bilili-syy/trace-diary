import { MMKV } from 'react-native-mmkv';
import * as SecureStore from 'expo-secure-store';
import CryptoJS from 'crypto-js';
import { DiaryEntry, AppSettings, ExportData } from '../types';

const STORAGE_KEY_NAME = 'mind-garden-encryption-key';
let storage: MMKV;
let isInitialized = false;

const generateEncryptionKey = (): string => {
  const randomBytes = CryptoJS.lib.WordArray.random(32);
  return randomBytes.toString(CryptoJS.enc.Hex);
};

export const initializeStorage = async (): Promise<void> => {
  if (isInitialized) return;

  let encryptionKey: string | null = null;
  
  try {
    encryptionKey = await SecureStore.getItemAsync(STORAGE_KEY_NAME);
    
    if (!encryptionKey) {
      encryptionKey = generateEncryptionKey();
      await SecureStore.setItemAsync(STORAGE_KEY_NAME, encryptionKey);
    }
  } catch (error) {
    console.warn('SecureStore error, using fallback key:', error);
    encryptionKey = 'mind-garden-fallback-key';
  }

  storage = new MMKV({
    id: 'mind-garden-storage',
    encryptionKey,
  });
  
  isInitialized = true;
};

export const getStorage = (): MMKV => {
  if (!isInitialized || !storage) {
    throw new Error('Storage not initialized. Call initializeStorage() first.');
  }
  return storage;
};

const STORAGE_KEYS = {
  DIARY_ENTRIES: 'diary_entries',
  APP_SETTINGS: 'app_settings',
  IS_APP_LOCK_ENABLED: 'is_app_lock_enabled',
  PIN_HASH: 'pin_hash',
  THEME: 'theme',
  THEME_ID: 'theme_id',
  IMAGE_COMPRESSION: 'image_compression',
  ONBOARDING_DONE: 'onboarding_done',
  TAG_PRESETS: 'tag_presets',
} as const;

// ============ 日记条目相关 ============

// 获取所有日记条目
export const getAllEntries = (): DiaryEntry[] => {
  try {
    const data = getStorage().getString(STORAGE_KEYS.DIARY_ENTRIES);
    if (!data) return [];
    return JSON.parse(data) as DiaryEntry[];
  } catch (error) {
    console.error('Error getting entries:', error);
    return [];
  }
};

// 保存所有日记条目
export const saveAllEntries = (entries: DiaryEntry[]): void => {
  try {
    getStorage().set(STORAGE_KEYS.DIARY_ENTRIES, JSON.stringify(entries));
  } catch (error) {
    console.error('Error saving entries:', error);
  }
};

// 获取单个日记条目
export const getEntryById = (id: string): DiaryEntry | null => {
  const entries = getAllEntries();
  return entries.find((entry) => entry.id === id) || null;
};

// 保存单个日记条目
export const saveEntry = (entry: DiaryEntry): void => {
  const entries = getAllEntries();
  const index = entries.findIndex((e) => e.id === entry.id);
  if (index >= 0) {
    entries[index] = entry;
  } else {
    entries.push(entry);
  }
  entries.sort((a, b) => b.date - a.date);
  saveAllEntries(entries);
};

// 删除日记条目
export const deleteEntry = (id: string): void => {
  const entries = getAllEntries();
  const filtered = entries.filter((e) => e.id !== id);
  saveAllEntries(filtered);
};

// 按日期获取日记
export const getEntriesByDate = (dateId: string): DiaryEntry | null => {
  return getEntryById(dateId);
};

// 获取指定月份的所有日记
export const getEntriesByMonth = (year: number, month: number): DiaryEntry[] => {
  const entries = getAllEntries();
  return entries.filter((entry) => {
    const date = new Date(entry.date);
    return date.getFullYear() === year && date.getMonth() === month;
  });
};

// ============ 应用设置相关 ============

// 获取应用锁状态
export const getAppLockEnabled = (): boolean => {
  return getStorage().getBoolean(STORAGE_KEYS.IS_APP_LOCK_ENABLED) ?? false;
};

// 设置应用锁状态
export const setAppLockEnabled = (enabled: boolean): void => {
  getStorage().set(STORAGE_KEYS.IS_APP_LOCK_ENABLED, enabled);
};

// 获取 PIN 码哈希
export const getPinHash = (): string | null => {
  return getStorage().getString(STORAGE_KEYS.PIN_HASH) ?? null;
};

// 设置 PIN 码哈希
export const setPinHash = (hash: string): void => {
  getStorage().set(STORAGE_KEYS.PIN_HASH, hash);
};

// 清除 PIN 码
export const clearPin = (): void => {
  getStorage().delete(STORAGE_KEYS.PIN_HASH);
};

// 获取主题设置
export const getTheme = (): 'light' | 'dark' => {
  return (getStorage().getString(STORAGE_KEYS.THEME) as 'light' | 'dark') ?? 'light';
};

// 设置主题
export const setTheme = (theme: 'light' | 'dark'): void => {
  getStorage().set(STORAGE_KEYS.THEME, theme);
};

// 获取主题ID
export const getThemeId = (): string | null => {
  return getStorage().getString(STORAGE_KEYS.THEME_ID) ?? null;
};

// 设置主题ID
export const setThemeId = (themeId: string): void => {
  getStorage().set(STORAGE_KEYS.THEME_ID, themeId);
};

// 获取图片压缩设置
export const getImageCompression = (): boolean => {
  return getStorage().getBoolean(STORAGE_KEYS.IMAGE_COMPRESSION) ?? true;
};

// 设置图片压缩
export const setImageCompression = (enabled: boolean): void => {
  getStorage().set(STORAGE_KEYS.IMAGE_COMPRESSION, enabled);
};

// 新手引导
export const getOnboardingDone = (): boolean => {
  return getStorage().getBoolean(STORAGE_KEYS.ONBOARDING_DONE) ?? false;
};

export const setOnboardingDone = (done: boolean): void => {
  getStorage().set(STORAGE_KEYS.ONBOARDING_DONE, done);
};

// ============ 鏍囩棰勮 ============ 

const DEFAULT_TAG_PRESETS = [
  '鏃ュ父',
  '蹇冩儏',
  '宸ヤ綔',
  '瀛︿範',
  '鏃呰',
  '瀹跺涵',
  '鍋ュ悍',
  '缇庨',
  '杩愬姩',
  '鐏垫劅',
  '鎰熸仼',
  '闃呰',
];

export const getTagPresets = (): string[] => {
  const data = getStorage().getString(STORAGE_KEYS.TAG_PRESETS);
  if (!data) {
    getStorage().set(STORAGE_KEYS.TAG_PRESETS, JSON.stringify(DEFAULT_TAG_PRESETS));
    return [...DEFAULT_TAG_PRESETS];
  }
  try {
    const parsed = JSON.parse(data);
    const cleaned = Array.isArray(parsed) ? parsed.filter((t) => typeof t === 'string') : [];
    if (cleaned.length === 0) return [];
    return cleaned;
  } catch {
    getStorage().set(STORAGE_KEYS.TAG_PRESETS, JSON.stringify(DEFAULT_TAG_PRESETS));
    return [...DEFAULT_TAG_PRESETS];
  }
};

export const setTagPresets = (tags: string[]): void => {
  getStorage().set(STORAGE_KEYS.TAG_PRESETS, JSON.stringify(tags));
};

// ============ 导入导出相关 ============

// 导出所有数据
export const exportAllData = (): ExportData => {
  const entries = getAllEntries();
  return {
    version: '1.0.0',
    exportDate: Date.now(),
    entries,
  };
};

// 导入数据（覆盖模式）
export const importDataOverwrite = (data: ExportData): void => {
  saveAllEntries(data.entries);
};

// 导入数据（合并模式）
export const importDataMerge = (data: ExportData): void => {
  const existingEntries = getAllEntries();
  const existingIds = new Set(existingEntries.map((e) => e.id));
  const newEntries = data.entries.filter((e) => !existingIds.has(e.id));
  const mergedEntries = [...existingEntries, ...newEntries];
  mergedEntries.sort((a, b) => b.date - a.date);
  saveAllEntries(mergedEntries);
};

// 清除所有数据
export const clearAllData = (): void => {
  getStorage().clearAll();
};

// ============ 草稿相关 ============

export interface DraftData {
  diaryId: string;
  content: string;
  mood?: string;
  weather?: string;
  images?: string[];
  tags?: string[];
  templateUsed?: string;
  savedAt: number;
}

const DRAFT_KEY = 'editor_draft';

export const saveDraft = (draft: DraftData): void => {
  getStorage().set(DRAFT_KEY, JSON.stringify(draft));
};

export const getDraft = (): DraftData | null => {
  const data = getStorage().getString(DRAFT_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data) as DraftData;
  } catch {
    return null;
  }
};

export const clearDraft = (): void => {
  getStorage().delete(DRAFT_KEY);
};
