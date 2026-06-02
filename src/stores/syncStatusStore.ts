import { create } from 'zustand';

// Runtime-only: whether the sync engine is mid-run, used by the status pill.
interface SyncStatusState {
  syncing: boolean;
  setSyncing: (v: boolean) => void;
}

export const useSyncStatusStore = create<SyncStatusState>((set) => ({
  syncing: false,
  setSyncing: (syncing) => set({ syncing }),
}));
