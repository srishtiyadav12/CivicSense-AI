/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./App.js"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Primary Gradient Colors
        primary: '#6366F1',
        'primary-dark': '#4F46E5',
        'primary-light': '#818CF8',

        // Accent Colors
        accent: '#EC4899',
        'accent-dark': '#DB2777',
        'accent-light': '#F472B6',

        // Backgrounds (Dark theme)
        background: '#0F172A',
        'background-light': '#1E293B',
        surface: '#1E293B',
        'surface-light': '#334155',
        card: '#1E293B',
        'card-light': '#334155',

        // Text Colors
        text: '#F1F5F9',
        'text-muted': '#94A3B8',
        'text-dim': '#64748B',
        'text-faint': '#475569',

        // Semantic
        success: '#10B981',
        'success-light': '#34D399',
        warning: '#F59E0B',
        'warning-light': '#FBBF24',
        error: '#EF4444',
        'error-light': '#F87171',
        info: '#3B82F6',
        'info-light': '#60A5FA',

        // Glassmorphism overlays
        'glass-light': 'rgba(255, 255, 255, 0.1)',
        'glass-medium': 'rgba(255, 255, 255, 0.15)',
        'glass-dark': 'rgba(0, 0, 0, 0.2)',

        // Borders
        border: '#334155',
        'border-light': '#475569',

        // Pure
        white: '#FFFFFF',
        black: '#000000',
      },
      fontSize: {
        xs: ['11px', '16px'],
        sm: ['13px', '18px'],
        base: ['15px', '22px'],
        lg: ['17px', '24px'],
        xl: ['20px', '28px'],
        '2xl': ['24px', '32px'],
        '3xl': ['30px', '36px'],
        '4xl': ['36px', '40px'],
        '5xl': ['48px', '1'],
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
        '2xl': '24px',
        '3xl': '32px',
        '4xl': '40px',
        '5xl': '48px',
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
        '2xl': '24px',
        '3xl': '32px',
        full: '9999px',
      },
    },
  },
  plugins: [],
};