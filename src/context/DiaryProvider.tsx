import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { DiaryEntry, DiaryAction, ExportData } from '../types';
import {
  getAllEntries,
  saveAllEntries,
  saveEntry as saveEntryToStorage,
  deleteEntry as deleteEntryFromStorage,
  importDataOverwrite,
  importDataMerge,
  exportAllData,
} from '../api/storage';
import { formatDateId } from '../utils/dateUtils';
import { deleteImages } from '../utils/imageStorage';

// 日记状态接口
interface DiaryState {
  entries: DiaryEntry[];
  isLoading: boolean;
}

// Context 接口
interface DiaryContextType {
  state: DiaryState;
  addEntry: (entry: DiaryEntry) => void;
  updateEntry: (entry: DiaryEntry) => void;
  deleteEntry: (id: string) => void;
  getEntryById: (id: string) => DiaryEntry | undefined;
  getEntriesByDateRange: (start: Date, end: Date) => DiaryEntry[];
  getTodayEntry: () => DiaryEntry | undefined;
  getThisDayLastYearEntries: () => DiaryEntry[];
  importEntries: (data: ExportData, mode: 'merge' | 'overwrite') => void;
  exportEntries: () => ExportData;
  refreshEntries: () => void;
}

// 初始状态
const initialState: DiaryState = {
  entries: [],
  isLoading: true,
};

// Reducer
function diaryReducer(state: DiaryState, action: DiaryAction): DiaryState {
  switch (action.type) {
    case 'SET_ENTRIES':
      return { ...state, entries: action.payload, isLoading: false };

    case 'ADD_ENTRY': {
      const existingIndex = state.entries.findIndex(e => e.id === action.payload.id);
      if (existingIndex >= 0) {
        const updatedEntries = [...state.entries];
        updatedEntries[existingIndex] = action.payload;
        return { ...state, entries: updatedEntries };
      }
      const newEntries = [...state.entries, action.payload];
      newEntries.sort((a, b) => b.date - a.date);
      return { ...state, entries: newEntries };
    }

    case 'UPDATE_ENTRY': {
      const updatedEntries = state.entries.map((entry) =>
        entry.id === action.payload.id ? action.payload : entry
      );
      return { ...state, entries: updatedEntries };
    }

    case 'DELETE_ENTRY': {
      const filteredEntries = state.entries.filter((entry) => entry.id !== action.payload);
      return { ...state, entries: filteredEntries };
    }

    case 'IMPORT_ENTRIES': {
      if (action.payload.mode === 'overwrite') {
        return { ...state, entries: action.payload.entries };
      } else {
        const existingIds = new Set(state.entries.map((e) => e.id));
        const newEntries = action.payload.entries.filter((e) => !existingIds.has(e.id));
        const mergedEntries = [...state.entries, ...newEntries];
        mergedEntries.sort((a, b) => b.date - a.date);
        return { ...state, entries: mergedEntries };
      }
    }

    default:
      return state;
  }
}

// 创建 Context
const DiaryContext = createContext<DiaryContextType | undefined>(undefined);

// Provider 组件
export function DiaryProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(diaryReducer, initialState);

  // 初始化加载数据
  useEffect(() => {
    const entries = getAllEntries();
    dispatch({ type: 'SET_ENTRIES', payload: entries });
  }, []);

  // 添加日记条目
  const addEntry = useCallback((entry: DiaryEntry) => {
    saveEntryToStorage(entry);
    dispatch({ type: 'ADD_ENTRY', payload: entry });
  }, []);

  // 更新日记条目
  const updateEntry = useCallback((entry: DiaryEntry) => {
    saveEntryToStorage(entry);
    dispatch({ type: 'UPDATE_ENTRY', payload: entry });
  }, []);

  // 删除日记条目
  const deleteEntry = useCallback(async (id: string) => {
    const entry = state.entries.find(e => e.id === id);
    if (entry?.images && entry.images.length > 0) {
      await deleteImages(entry.images);
    }
    deleteEntryFromStorage(id);
    dispatch({ type: 'DELETE_ENTRY', payload: id });
  }, [state.entries]);

  // 通过 ID 获取日记
  const getEntryById = useCallback(
    (id: string) => {
      return state.entries.find((entry) => entry.id === id);
    },
    [state.entries]
  );

  // 获取日期范围内的日记
  const getEntriesByDateRange = useCallback(
    (start: Date, end: Date) => {
      return state.entries.filter((entry) => {
        const entryDate = new Date(entry.date);
        return entryDate >= start && entryDate <= end;
      });
    },
    [state.entries]
  );

  // 获取今天的日记
  const getTodayEntry = useCallback(() => {
    const todayId = formatDateId(new Date());
    return state.entries.find((entry) => entry.id === todayId);
  }, [state.entries]);

  // 获取"那年今日"的日记
  const getThisDayLastYearEntries = useCallback(() => {
    const today = new Date();
    return state.entries.filter((entry) => {
      const entryDate = new Date(entry.date);
      return (
        entryDate.getMonth() === today.getMonth() &&
        entryDate.getDate() === today.getDate() &&
        entryDate.getFullYear() !== today.getFullYear()
      );
    });
  }, [state.entries]);

  // 导入日记
  const importEntries = useCallback((data: ExportData, mode: 'merge' | 'overwrite') => {
    if (mode === 'overwrite') {
      importDataOverwrite(data);
    } else {
      importDataMerge(data);
    }
    dispatch({ type: 'IMPORT_ENTRIES', payload: { entries: data.entries, mode } });
  }, []);

  // 导出日记
  const exportEntries = useCallback(() => {
    return exportAllData();
  }, []);

  // 刷新数据
  const refreshEntries = useCallback(() => {
    const entries = getAllEntries();
    dispatch({ type: 'SET_ENTRIES', payload: entries });
  }, []);

  const value: DiaryContextType = {
    state,
    addEntry,
    updateEntry,
    deleteEntry,
    getEntryById,
    getEntriesByDateRange,
    getTodayEntry,
    getThisDayLastYearEntries,
    importEntries,
    exportEntries,
    refreshEntries,
  };

  return <DiaryContext.Provider value={value}>{children}</DiaryContext.Provider>;
}

// 自定义 Hook
export function useDiary() {
  const context = useContext(DiaryContext);
  if (!context) {
    throw new Error('useDiary must be used within a DiaryProvider');
  }
  return context;
}

export default DiaryProvider;
