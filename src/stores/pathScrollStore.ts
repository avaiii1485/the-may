import { create } from 'zustand';

// Runtime-only one-shot signals consumed on the Path tab's next focus:
// - jumpToBottom: a new meal was saved → scroll down to reveal it.
// - focusMealId: a meal's time was edited → scroll to its new timeline position.
// Every other return to Path restores the previous scroll position instead.
interface PathScrollState {
  jumpToBottom: boolean;
  focusMealId: string | null;
  // savedOffset + initialized live here (not in component refs) so they survive
  // a Path-screen remount — which Android's edge-swipe back gesture triggers.
  // Without this, the remount looked like a first launch and snapped to bottom.
  savedOffset: number;
  initialized: boolean;
  requestJumpToBottom: () => void;
  clearJump: () => void;
  requestFocusMeal: (id: string) => void;
  clearFocusMeal: () => void;
  setSavedOffset: (y: number) => void;
  markInitialized: () => void;
}

export const usePathScrollStore = create<PathScrollState>((set) => ({
  jumpToBottom: false,
  focusMealId: null,
  savedOffset: 0,
  initialized: false,
  requestJumpToBottom: () => set({ jumpToBottom: true }),
  clearJump: () => set({ jumpToBottom: false }),
  requestFocusMeal: (id) => set({ focusMealId: id }),
  clearFocusMeal: () => set({ focusMealId: null }),
  setSavedOffset: (y) => set({ savedOffset: y }),
  markInitialized: () => set({ initialized: true }),
}));
