import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import { ThemeColors, ThemePreset, THEME_PRESETS, DEFAULT_THEME_ID, getThemeById } from '../constants/Colors';
import { getThemeId, setThemeId, getStorage } from '../api/storage';

type ColorMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: ThemePreset;
  colors: ThemeColors;
  colorMode: ColorMode;
  isDark: boolean;
  setTheme: (themeId: string) => void;
  setColorMode: (mode: ColorMode) => void;
  availableThemes: ThemePreset[];
}

const STORAGE_KEY_COLOR_MODE = 'color_mode';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<ThemePreset>(getThemeById(DEFAULT_THEME_ID));
  const [colorMode, setColorModeState] = useState<ColorMode>('system');

  useEffect(() => {
    const savedThemeId = getThemeId();
    if (savedThemeId) {
      setThemeState(getThemeById(savedThemeId));
    }
    const savedColorMode = getStorage().getString(STORAGE_KEY_COLOR_MODE) as ColorMode | undefined;
    if (savedColorMode) {
      setColorModeState(savedColorMode);
    }
  }, []);

  const isDark = colorMode === 'system' 
    ? systemColorScheme === 'dark' 
    : colorMode === 'dark';

  const setTheme = useCallback((themeId: string) => {
    const newTheme = getThemeById(themeId);
    setThemeState(newTheme);
    setThemeId(themeId);
  }, []);

  const setColorMode = useCallback((mode: ColorMode) => {
    setColorModeState(mode);
    getStorage().set(STORAGE_KEY_COLOR_MODE, mode);
  }, []);

  const value: ThemeContextType = {
    theme,
    colors: isDark ? theme.darkColors : theme.colors,
    colorMode,
    isDark,
    setTheme,
    setColorMode,
    availableThemes: THEME_PRESETS,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export default ThemeProvider;
