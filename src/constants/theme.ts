import { Platform } from 'react-native';

export const LotusTheme = {
  primary: '#166534',
  primaryDark: '#093310',
  primaryLight: '#22c55e',
  primaryHover: '#15803d',
  accent: '#f59e0b',
  accentLight: '#fde047',
  accentDark: '#b45309',
  background: '#f8fafc',
  card: '#ffffff',
  text: '#0f172a',
  textMuted: '#64748b',
  border: '#e2e8f0',
  success: '#16a34a',
  danger: '#dc2626',
  warning: '#d97706',
  info: '#0284c7',
  purple: '#9333ea',
};

export const Colors = {
  light: {
    text: '#0f172a',
    background: '#f8fafc',
    backgroundElement: '#ffffff',
    backgroundSelected: '#dcfce7',
    textSecondary: '#64748b',
    primary: LotusTheme.primary,
    accent: LotusTheme.accent,
  },
  dark: {
    text: '#f8fafc',
    background: '#0a1f0f',
    backgroundElement: '#13351a',
    backgroundSelected: '#1c4d26',
    textSecondary: '#94a3b8',
    primary: LotusTheme.primaryLight,
    accent: LotusTheme.accentLight,
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'sans-serif',
    serif: 'serif',
    rounded: 'sans-serif',
    mono: 'monospace',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 1200;

export function formatVND(amount: number | string | undefined | null): string {
  const val = Number(amount || 0);
  return val.toLocaleString('vi-VN') + ' đ';
}
