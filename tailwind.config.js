/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  // 'class' instead of 'media' so react-native-css-interop's web runtime
  // doesn't throw "Cannot manually set color scheme" when something nudges
  // the document's color-scheme class.
  darkMode: 'class',
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        path: {
          DEFAULT: '#F39C3D',
          dark: '#D6791F',
          soft: '#FCEBD3',
        },
        ink: {
          DEFAULT: '#0F172A',
          soft: '#475569',
          mute: '#94A3B8',
        },
        bubble: {
          bg: '#F1F5F9',
          active: '#1FB6E5',
          activeText: '#FFFFFF',
        },
        accent: {
          blue: '#1FB6E5',
          purple: '#8C6CF1',
          pink: '#F25C8B',
          green: '#34C9A2',
          yellow: '#F4C04C',
        },
        bg: {
          DEFAULT: '#FFFFFF',
          card: '#F8FAFC',
        },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
      spacing: {
        '13': '3.25rem',
      },
      borderRadius: {
        bubble: '9999px',
      },
    },
  },
  plugins: [],
};
