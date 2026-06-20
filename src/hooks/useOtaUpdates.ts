import * as Updates from 'expo-updates';
import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

// Auto-apply OTA updates without the user noticing. The default expo-updates
// behavior only downloads in the background and applies on a *later* launch —
// and on a slow/restricted network the background download often never finishes
// in the open window, so updates appeared stuck until a cache clear. Here we
// explicitly await the download and reload into it, so an update lands on its
// own within the current launch (or the next foreground), no cold-start dance.
export function useOtaUpdates(): void {
  const running = useRef(false);

  useEffect(() => {
    // No-op in dev / Expo Go / on web — updates only run in a production build.
    if (__DEV__ || !Updates.isEnabled) return;

    const checkAndApply = async (allowReload: boolean) => {
      if (running.current) return;
      running.current = true;
      try {
        const res = await Updates.checkForUpdateAsync();
        if (res.isAvailable) {
          await Updates.fetchUpdateAsync(); // awaited → guaranteed complete
          // On launch, reload straight into the new bundle (no user work to
          // lose). Mid-session we only stage it — expo-updates applies a fetched
          // update on the next launch on its own — so we don't interrupt the
          // user (e.g. wipe a half-typed meal) with a surprise reload.
          if (allowReload) await Updates.reloadAsync();
        }
      } catch {
        // Offline / server unreachable / no update — ignore and try again later.
      } finally {
        running.current = false;
      }
    };

    // Launch: apply immediately. (AppState 'active' does not fire at cold start,
    // only on a real foreground transition, so this is the launch path.)
    checkAndApply(true);

    // Returning to the app later: fetch + stage for the next launch, no reload.
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') checkAndApply(false);
    });
    return () => sub.remove();
  }, []);
}
