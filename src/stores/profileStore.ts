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

export interface ProfileData {
  avatarUri: string | null;
  preferredName: string;
  handle: string;
  phoneNumber: string;
  email: string;
  bio: string;
  joinedAt: string;
}

interface ProfileState extends ProfileData {
  update: (patch: Partial<ProfileData>) => void;
}

const initial: ProfileData = {
  avatarUri: null,
  preferredName: '',
  handle: '',
  phoneNumber: '',
  email: '',
  bio: '',
  joinedAt: new Date().toISOString(),
};

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      ...initial,
      update: (patch) => set((s) => ({ ...s, ...patch })),
    }),
    { name: 'the-may-profile-v1', storage },
  ),
);
