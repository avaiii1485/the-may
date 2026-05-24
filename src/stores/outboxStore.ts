import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import { uuidv4 } from '@/lib/uuid';
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

export type OutboxKind = 'create' | 'update' | 'delete';

export type MealPatch = Partial<Omit<Meal, 'id' | 'userId' | 'createdAt'>>;

export interface OutboxOp {
  /** Op id (distinct from mealId). */
  id: string;
  kind: OutboxKind;
  mealId: string;
  /** Present for 'create'. The full meal to insert (photoUrl may be a local URI). */
  meal?: Meal;
  /** Present for 'update'. */
  patch?: MealPatch;
  attempts: number;
  lastError?: string;
  createdAt: string;
}

interface OutboxState {
  ops: OutboxOp[];
  enqueueCreate: (meal: Meal) => void;
  enqueueUpdate: (mealId: string, patch: MealPatch) => void;
  enqueueDelete: (mealId: string) => void;
  /** Remove a successfully-synced op. */
  remove: (opId: string) => void;
  /** Record a failed sync attempt for backoff/visibility. */
  markAttempt: (opId: string, error: string) => void;
  clear: () => void;
}

function newOp(kind: OutboxKind, mealId: string, extra: Partial<OutboxOp>): OutboxOp {
  return {
    id: uuidv4(),
    kind,
    mealId,
    attempts: 0,
    createdAt: new Date().toISOString(),
    ...extra,
  };
}

export const useOutboxStore = create<OutboxState>()(
  persist(
    (set) => ({
      ops: [],

      enqueueCreate: (meal) =>
        set((s) => ({ ops: [...s.ops, newOp('create', meal.id, { meal })] })),

      // Coalesce: fold updates into a pending create or a prior pending update so
      // the queue never holds more ops than necessary for one meal.
      enqueueUpdate: (mealId, patch) =>
        set((s) => {
          const pendingCreate = s.ops.find((o) => o.mealId === mealId && o.kind === 'create');
          if (pendingCreate && pendingCreate.meal) {
            const mergedMeal: Meal = { ...pendingCreate.meal, ...patch };
            return {
              ops: s.ops.map((o) =>
                o.id === pendingCreate.id ? { ...o, meal: mergedMeal } : o,
              ),
            };
          }
          const pendingUpdate = s.ops.find((o) => o.mealId === mealId && o.kind === 'update');
          if (pendingUpdate) {
            return {
              ops: s.ops.map((o) =>
                o.id === pendingUpdate.id
                  ? { ...o, patch: { ...o.patch, ...patch }, attempts: 0, lastError: undefined }
                  : o,
              ),
            };
          }
          return { ops: [...s.ops, newOp('update', mealId, { patch })] };
        }),

      // Coalesce: deleting a meal that was created offline (never synced) cancels
      // the whole chain — nothing to send. Otherwise drop pending updates and
      // queue a single delete.
      enqueueDelete: (mealId) =>
        set((s) => {
          const hadPendingCreate = s.ops.some(
            (o) => o.mealId === mealId && o.kind === 'create',
          );
          const withoutMeal = s.ops.filter((o) => o.mealId !== mealId);
          if (hadPendingCreate) return { ops: withoutMeal };
          return { ops: [...withoutMeal, newOp('delete', mealId, {})] };
        }),

      remove: (opId) => set((s) => ({ ops: s.ops.filter((o) => o.id !== opId) })),

      markAttempt: (opId, error) =>
        set((s) => ({
          ops: s.ops.map((o) =>
            o.id === opId ? { ...o, attempts: o.attempts + 1, lastError: error } : o,
          ),
        })),

      clear: () => set({ ops: [] }),
    }),
    { name: 'the-may-outbox-v1', storage },
  ),
);
