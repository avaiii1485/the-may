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
  /** True when there are local profile edits not yet pushed to the server. */
  dirty: boolean;
  /** User edit — marks the profile dirty so the sync engine pushes it. */
  update: (patch: Partial<ProfileData>) => void;
  /** Server -> local: apply remote values without dirtying (won't be pushed back). */
  adopt: (patch: Partial<ProfileData>) => void;
  clearDirty: () => void;
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
      dirty: false,
      update: (patch) => set((s) => ({ ...s, ...patch, dirty: true })),
      adopt: (patch) =>
        set((s) => {
          // Skip if nothing actually changed, to avoid needless re-renders/sync.
          const changed = (Object.keys(patch) as (keyof ProfileData)[]).some(
            (k) => patch[k] !== undefined && patch[k] !== s[k],
          );
          return changed ? { ...s, ...patch } : s;
        }),
      clearDirty: () => set({ dirty: false }),
    }),
    {
      name: 'the-may-profile-v2',
      storage,
      // dirty is runtime-only; don't persist it.
      partialize: (s) => ({
        avatarUri: s.avatarUri,
        preferredName: s.preferredName,
        handle: s.handle,
        phoneNumber: s.phoneNumber,
        email: s.email,
        bio: s.bio,
        joinedAt: s.joinedAt,
      }),
    },
  ),
);
