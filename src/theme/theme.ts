export interface ThemeColors {
  background: string;
  surface: string;
  card: string;
  surfaceContainer: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentSecondary: string;
  accentTertiary: string;
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
  surfaceContainer: '#2A254D',
  text: '#F8F8FF', // Ghost White
  textSecondary: '#A5A6F6', // Light retro purple
  textMuted: '#9CA3AF',
  accent: '#3B82F6', // Blue
  accentSecondary: '#0EA5E9', // Sky Blue
  accentTertiary: '#6366F1', // Indigo
  warning: '#F59E0B', // Amber
  danger: '#EF4444', // Red
  border: '#374151',
  accentSemiTrans: 'rgba(59, 130, 246, 0.15)',
  divider: 'rgba(255, 255, 255, 0.08)',
};

export const lightTheme: ThemeColors = {
  background: '#f4f6fa',
  surface: '#ffffff',
  card: '#ffffff',
  surfaceContainer: '#f0f4ff',
  text: '#0b1c30',
  textSecondary: '#494454',
  textMuted: '#6B7280',
  accent: '#2563EB', // Blue
  accentSecondary: '#0284C7', // Light Blue / Cerulean
  accentTertiary: '#4F46E5', // Indigo
  warning: '#D97706', // Amber
  danger: '#DC2626', // Red
  border: 'rgba(0, 0, 0, 0.1)',
  accentSemiTrans: 'rgba(37, 99, 235, 0.1)',
  divider: 'rgba(0, 0, 0, 0.05)',
};

export const theme = {
  spacing: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 6,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    round: 9999,
  },
};
