import { Platform } from 'react-native';

/**
 * 3-color palette:
 *   Blue  — primary actions, accents, durations
 *   Red   — stop / destructive actions
 *   Green — milestones / success
 */
export const Palette = {
  blue: '#007AFF',
  blueDark: '#0A84FF',
  red: '#FF3B30',
  green: '#34C759',
};

export const Colors = {
  light: {
    text: '#1C1C1E',
    textSecondary: '#8E8E93',
    background: '#FFFFFF',
    surface: '#F2F2F7',
    tint: Palette.blue,
    icon: '#8E8E93',
    tabIconDefault: '#8E8E93',
    tabIconSelected: Palette.blue,
    border: '#D1D1D6',
  },
  dark: {
    text: '#F2F2F7',
    textSecondary: '#8E8E93',
    background: '#000000',
    surface: '#1C1C1E',
    tint: Palette.blueDark,
    icon: '#8E8E93',
    tabIconDefault: '#8E8E93',
    tabIconSelected: Palette.blueDark,
    border: '#38383A',
  },
};

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
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
