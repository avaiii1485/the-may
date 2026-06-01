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
const DEFAULT_PINNED = ['top-insight', 'fasting', 'todays-experiment', 'last-12-weeks'];

interface PinnedState {
  pinned: string[];
  /**
   * User-defined display order of insight card ids (drag-and-drop result).
   * Empty means "no custom order yet" — the screen falls back to its natural
   * order. A fresh device adopts the cloud order via the sync engine.
   */
  order: string[];
  toggle: (id: string) => void;
  /** Replace the full card order (from a drag reorder). */
  setOrder: (ids: string[]) => void;
}

export const usePinnedInsightsStore = create<PinnedState>()(
  persist(
    (set) => ({
      pinned: DEFAULT_PINNED,
      order: [],
      // Pinning also hoists the card to the front of the order; unpinning leaves
      // its position alone. Drag-and-drop then gives full manual control.
      toggle: (id) =>
        set((s) => {
          const isPinned = s.pinned.includes(id);
          if (isPinned) {
            return { pinned: s.pinned.filter((x) => x !== id) };
          }
          const order = s.order.length > 0 ? [id, ...s.order.filter((x) => x !== id)] : s.order;
          return { pinned: [id, ...s.pinned], order };
        }),
      setOrder: (ids) => set({ order: ids }),
    }),
    { name: 'the-may-pinned-v2', storage },
  ),
);
