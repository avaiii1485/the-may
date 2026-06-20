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
        // Tokens below are driven by CSS variables (see global.css) so they flip
        // between light and dark with the `dark` class. Fixed hex values (path
        // orange, sage, accents) read fine on both themes and stay constant.
        path: {
          DEFAULT: '#F39C3D',
          dark: '#D6791F',
          soft: 'rgb(var(--path-soft) / <alpha-value>)',
        },
        ink: {
          DEFAULT: 'rgb(var(--ink) / <alpha-value>)',
          soft: 'rgb(var(--ink-soft) / <alpha-value>)',
          mute: 'rgb(var(--ink-mute) / <alpha-value>)',
        },
        bubble: {
          bg: 'rgb(var(--bubble-bg) / <alpha-value>)',
          active: '#7FA37B',
          activeText: '#FFFFFF',
        },
        accent: {
          blue: '#7FA37B',
          purple: '#8C6CF1',
          pink: '#F25C8B',
          green: '#34C9A2',
          yellow: '#F4C04C',
        },
        bg: {
          DEFAULT: 'rgb(var(--bg) / <alpha-value>)',
          card: 'rgb(var(--bg-card) / <alpha-value>)',
        },
        // Soft creamy app background — warm, classy, brightens every screen.
        cream: {
          DEFAULT: 'rgb(var(--cream) / <alpha-value>)',
          deep: 'rgb(var(--cream-deep) / <alpha-value>)',
        },
        // Only the two hairline shades the app uses for borders are overridden,
        // so existing border-slate-100/200 flip in dark too. Other slate shades
        // keep Tailwind's defaults.
        slate: {
          100: 'rgb(var(--line) / <alpha-value>)',
          200: 'rgb(var(--line-strong) / <alpha-value>)',
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
