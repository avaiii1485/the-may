import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import type { Meal } from '@/types/meal';

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

interface LocalMealsState {
  meals: Meal[];
  goal: string;
  hydrated: boolean;
  setGoal: (g: string) => void;
  addMeal: (m: Meal) => void;
  updateMeal: (id: string, patch: Partial<Meal>) => void;
  removeMeal: (id: string) => void;
  setMeals: (m: Meal[]) => void;
  /**
   * Replace one user's meals with the given list, preserving any other user's
   * rows. Used by the sync engine after pulling server state (callers merge in
   * still-pending local ops before calling this).
   */
  replaceUserMeals: (userId: string, meals: Meal[]) => void;
}

export const useLocalMealsStore = create<LocalMealsState>()(
  persist(
    (set) => ({
      meals: [],
      goal: 'Feeling happy and healthy',
      hydrated: false,
      setGoal: (goal) => set({ goal }),
      addMeal: (m) => set((s) => ({ meals: [m, ...s.meals] })),
      updateMeal: (id, patch) =>
        set((s) => ({
          meals: s.meals.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        })),
      removeMeal: (id) => set((s) => ({ meals: s.meals.filter((x) => x.id !== id) })),
      setMeals: (meals) => set({ meals }),
      replaceUserMeals: (userId, meals) =>
        set((s) => ({ meals: [...s.meals.filter((m) => m.userId !== userId), ...meals] })),
    }),
    {
      name: 'the-may-local-v1',
      storage,
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    },
  ),
);
