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

interface SeenBadgesState {
  seen: string[];
  /** Whether we've taken the first snapshot of already-earned badges. */
  primed: boolean;
  /** Record the initial set of earned badges with no celebration. */
  prime: (earnedIds: string[]) => void;
  /** Mark badges as seen (after celebrating them). */
  markSeen: (ids: string[]) => void;
}

export const useSeenBadgesStore = create<SeenBadgesState>()(
  persist(
    (set) => ({
      seen: [],
      primed: false,
      prime: (earnedIds) => set({ seen: earnedIds, primed: true }),
      markSeen: (ids) =>
        set((s) => ({ seen: Array.from(new Set([...s.seen, ...ids])) })),
    }),
    { name: 'the-may-seen-badges-v1', storage },
  ),
);
