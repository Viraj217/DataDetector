import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { ThemeColors, darkTheme, lightTheme } from './theme';
import { queries } from '../database/queries';

type ThemeMode = 'dark' | 'light' | 'system';

interface ThemeContextType {
  themeMode: ThemeMode;
  colors: ThemeColors;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeState] = useState<ThemeMode>('dark');

  // Load theme mode from DB on mount
  useEffect(() => {
    try {
      const savedMode = queries.getSetting('theme_mode') as ThemeMode | null;
      if (savedMode) {
        setThemeState(savedMode);
      }
    } catch (e) {
      console.error('Failed to load theme setting:', e);
    }
  }, []);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeState(mode);
    try {
      queries.setSetting('theme_mode', mode);
    } catch (e) {
      console.error('Failed to save theme setting:', e);
    }
  };

  const isDark =
    themeMode === 'system'
      ? systemColorScheme === 'dark'
      : themeMode === 'dark';

  const colors = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ themeMode, colors, isDark, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
