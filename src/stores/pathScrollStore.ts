import { create } from 'zustand';

// Runtime-only one-shot signals consumed on the Path tab's next focus:
// - jumpToBottom: a new meal was saved → scroll down to reveal it.
// - focusMealId: a meal's time was edited → scroll to its new timeline position.
// Every other return to Path restores the previous scroll position instead.
interface PathScrollState {
  jumpToBottom: boolean;
  focusMealId: string | null;
  requestJumpToBottom: () => void;
  clearJump: () => void;
  requestFocusMeal: (id: string) => void;
  clearFocusMeal: () => void;
}

export const usePathScrollStore = create<PathScrollState>((set) => ({
  jumpToBottom: false,
  focusMealId: null,
  requestJumpToBottom: () => set({ jumpToBottom: true }),
  clearJump: () => set({ jumpToBottom: false }),
  requestFocusMeal: (id) => set({ focusMealId: id }),
  clearFocusMeal: () => set({ focusMealId: null }),
}));
