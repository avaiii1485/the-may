import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';

const webStorage: StateStorage = {
  getItem: (key) => (typeof window === 'undefined' ? null : window.localStorage.getItem(key)),
  setItem: (key, value) => {
    if (typeof window !== 'undefined') window.localStorage.setItem(key, value);
  },
  removeItem: (key) => {
    if (typeof window !== 'undefined') window.localStorage.removeItem(key);
  },
};

const storage = createJSONStorage(() =>
  Platform.OS === 'web' ? webStorage : (AsyncStorage as unknown as StateStorage),
);

// Pre-pinned so the default Insights layout matches what users already have.
// Order is most-recent-first; newly pinned cards are prepended.
const DEFAULT_PINNED = ['top-insight', 'fasting', 'todays-experiment', 'last-12-weeks'];

interface PinnedState {
  pinned: string[];
  toggle: (id: string) => void;
}

export const usePinnedInsightsStore = create<PinnedState>()(
  persist(
    (set) => ({
      pinned: DEFAULT_PINNED,
      toggle: (id) =>
        set((s) => ({
          pinned: s.pinned.includes(id)
            ? s.pinned.filter((x) => x !== id)
            : [id, ...s.pinned],
        })),
    }),
    { name: 'the-may-pinned-v1', storage },
  ),
);
