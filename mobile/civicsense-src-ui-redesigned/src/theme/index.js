import { Platform } from 'react-native';

/**
 * CivicSense AI — mobile design system.
 * UI-only tokens: changing these values updates the visual language
 * without changing application behaviour.
 */

export const colors = {
  // App surfaces
  background: '#F6F8FA',
  surface: '#FFFFFF',
  surfaceAlt: '#F0F5F5',
  card: '#FFFFFF',

  // Text
  textStrong: '#102A2E',
  text: '#203B40',
  body: '#536B70',
  muted: '#75888C',
  faint: '#9AA9AD',
  line: '#E3EBEC',
  lineDeep: '#D3DFE1',

  // Brand
  brand: '#0F766E',
  brandDeep: '#0B5F59',
  brandSoft: '#E7F5F3',
  brandInk: '#0B3434',

  // Supporting accents
  cyan: '#1687A7',
  violet: '#7257C7',
  pink: '#C34C88',

  // Semantic
  success: '#168A5B',
  danger: '#D84C52',
  warning: '#C88718',

  // Legacy aliases kept so existing screens/features continue to work
  ink950: '#081A1D',
  ink900: '#0D2529',
  ink800: '#15373B',
  ink700: '#244A4E',

  white: '#FFFFFF',
  black: '#000000',
};

export const STATUS_COLORS = {
  submitted: colors.brand,
  under_review: colors.cyan,
  assigned: colors.violet,
  in_progress: colors.warning,
  resolved: colors.success,
  rejected: colors.danger,
  reopened: '#5E67C8',
};

export const PRIORITY_COLORS = {
  1: colors.success,
  2: '#CA8A04',
  3: '#E36B2C',
  4: colors.danger,
};

export const space = {
  xs: 4,
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  xxl: 36,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  pill: 999,
};

export const font = {
  regular: Platform.select({ ios: '400', default: '400' }),
  medium: Platform.select({ ios: '500', default: '500' }),
  semibold: Platform.select({ ios: '600', default: '600' }),
  bold: Platform.select({ ios: '700', default: '700' }),
  xs: 11,
  sm: 13,
  md: 15,
  lg: 18,
  xl: 23,
  xxl: 30,
};

export const shadow = {
  card: {
    shadowColor: '#15373B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
  },
  floating: {
    shadowColor: colors.brandDeep,
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.20,
    shadowRadius: 14,
    elevation: 7,
  },
};

const theme = { colors, STATUS_COLORS, PRIORITY_COLORS, space, radius, font, shadow };
export default theme;
