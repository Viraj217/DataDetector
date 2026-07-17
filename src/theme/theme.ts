export interface ThemeColors {
  background: string;
  surface: string;
  card: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  warning: string;
  danger: string;
  border: string;
  accentSemiTrans: string;
  divider: string;
}

export const darkTheme: ThemeColors = {
  background: '#0D0B1A', // Deep dark purple/navy
  surface: '#131127',
  card: '#1D1934',
  text: '#F8F8FF', // Ghost White
  textSecondary: '#A5A6F6', // Light retro purple
  textMuted: '#666999',
  accent: '#FF007F', // Neon Pink
  warning: '#FFD700', // Electric Yellow
  danger: '#00FFFF', // Electric Cyan
  border: '#2A254D',
  accentSemiTrans: 'rgba(255, 0, 127, 0.15)',
  divider: 'rgba(255, 255, 255, 0.08)',
};

export const lightTheme: ThemeColors = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  card: '#F1F5F9',
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  accent: '#059669',
  warning: '#D97706',
  danger: '#DC2626',
  border: '#E2E8F0',
  accentSemiTrans: 'rgba(5, 150, 105, 0.1)',
  divider: 'rgba(0, 0, 0, 0.05)',
};

export const theme = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 6,
    md: 12,
    lg: 16,
    round: 9999,
  },
};
