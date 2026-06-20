import { useColorScheme } from 'nativewind';
import { useEffect } from 'react';
import { useThemeStore } from '@/stores/themeStore';

// Bridges the persisted theme store to NativeWind's class-based dark mode, so
// `dark:` utilities flip whenever the user toggles the theme. (Tailwind is set
// to darkMode: 'class', which is what permits setting the scheme manually.)
export function useApplyTheme(): void {
  const mode = useThemeStore((s) => s.mode);
  const { setColorScheme } = useColorScheme();
  useEffect(() => {
    try {
      setColorScheme(mode);
    } catch {
      // css-interop can throw if misconfigured; never let theming crash the app.
    }
  }, [mode, setColorScheme]);
}
