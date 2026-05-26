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

interface AuthPromptState {
  /** Whether the user dismissed the sign-in invite ("Skip for now"). */
  dismissed: boolean;
  setDismissed: (v: boolean) => void;
}

export const useAuthPromptStore = create<AuthPromptState>()(
  persist(
    (set) => ({
      dismissed: false,
      setDismissed: (dismissed) => set({ dismissed }),
    }),
    { name: 'the-may-auth-prompt-v1', storage },
  ),
);
