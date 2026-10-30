import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { darkColors, lightColors, type SemanticColors, type ThemePreference } from './colors';

export interface ThemeValue {
  preference: ThemePreference;
  mode: 'light' | 'dark';
  colors: SemanticColors;
}

const ThemeContext = createContext<ThemeValue | null>(null);

export function ThemeProvider({
  children,
  preference = 'system',
}: {
  children: ReactNode;
  preference?: ThemePreference;
}) {
  const system = useColorScheme();
  const mode = preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference;

  const value = useMemo<ThemeValue>(
    () => ({
      preference,
      mode,
      colors: mode === 'dark' ? darkColors : lightColors,
    }),
    [mode, preference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return value;
}
