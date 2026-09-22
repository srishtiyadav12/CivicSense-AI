// CivicSense AI — Modern Redesigned Theme
// Gradient-based design system with glassmorphism

export const colors = {
  // Primary Gradient Colors
  primary: '#6366F1',        // Indigo
  primaryDark: '#4F46E5',
  primaryLight: '#818CF8',

  // Accent Colors
  accent: '#EC4899',         // Pink
  accentDark: '#DB2777',
  accentLight: '#F472B6',

  // Success/Status Colors
  success: '#10B981',
  successLight: '#34D399',
  warning: '#F59E0B',
  warningLight: '#FBBF24',
  error: '#EF4444',
  errorLight: '#F87171',
  info: '#3B82F6',
  infoLight: '#60A5FA',

  // Backgrounds
  background: '#0F172A',     // Dark slate
  backgroundLight: '#1E293B',
  surface: '#1E293B',
  surfaceLight: '#334155',
  card: '#1E293B',
  cardLight: '#334155',

  // Text Colors
  text: '#F1F5F9',
  textMuted: '#94A3B8',
  textDim: '#64748B',
  textFaint: '#475569',

  // Glassmorphism overlays
  glassLight: 'rgba(255, 255, 255, 0.1)',
  glassMedium: 'rgba(255, 255, 255, 0.15)',
  glassDark: 'rgba(0, 0, 0, 0.2)',

  // Overlays
  overlay: 'rgba(15, 23, 42, 0.85)',
  overlayLight: 'rgba(15, 23, 42, 0.6)',

  // Borders
  border: '#334155',
  borderLight: '#475569',

  // Pure
  white: '#FFFFFF',
  black: '#000000',
};

export const gradients = {
  primary: ['#6366F1', '#8B5CF6', '#EC4899'],
  primarySubtle: ['#6366F1', '#7C3AED'],
  accent: ['#EC4899', '#F43F5E'],
  success: ['#10B981', '#14B8A6'],
  warning: ['#F59E0B', '#EF4444'],
  dark: ['#1E293B', '#0F172A'],
  card: ['#334155', '#1E293B'],
};

export const typography = {
  fontSizes: {
    xs: 11,
    sm: 13,
    base: 15,
    lg: 17,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },
  fontWeights: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
  lineHeights: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
  },
  glow: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
};

// Status badge colors
export const STATUS_COLORS = {
  submitted: '#6366F1',
  under_review: '#3B82F6',
  assigned: '#8B5CF6',
  in_progress: '#F59E0B',
  resolved: '#10B981',
  rejected: '#EF4444',
  reopened: '#EC4899',
};

// Priority colors
export const PRIORITY_COLORS = {
  1: '#10B981',  // Low - Green
  2: '#3B82F6',  // Medium - Blue
  3: '#F59E0B',  // High - Orange
  4: '#EF4444',  // Urgent - Red
  low: '#10B981',
  medium: '#3B82F6',
  high: '#F59E0B',
  urgent: '#EF4444',
};

// Complaint type icons and colors
export const COMPLAINT_TYPES = {
  pothole: { icon: '🚧', color: '#F59E0B', label: 'Pothole' },
  garbage: { icon: '🗑️', color: '#EF4444', label: 'Garbage' },
  broken_streetlight: { icon: '💡', color: '#FBBF24', label: 'Streetlight' },
  water_leakage: { icon: '💧', color: '#3B82F6', label: 'Water Leak' },
  drainage: { icon: '🌊', color: '#0EA5E9', label: 'Drainage' },
  damaged_infrastructure: { icon: '🏗️', color: '#F97316', label: 'Infrastructure' },
  noise_pollution: { icon: '🔊', color: '#8B5CF6', label: 'Noise' },
  stray_animals: { icon: '🐕', color: '#EC4899', label: 'Animals' },
  electricity: { icon: '⚡', color: '#EAB308', label: 'Electricity' },
  sewage: { icon: '🚰', color: '#14B8A6', label: 'Sewage' },
  other: { icon: '📋', color: '#64748B', label: 'Other' },
};

export default {
  colors,
  gradients,
  typography,
  spacing,
  borderRadius,
  shadows,
  STATUS_COLORS,
  PRIORITY_COLORS,
  COMPLAINT_TYPES,
};
