import { create } from 'zustand';

// Runtime-only one-shot signal: set when a new meal is saved so the Path tab
// scrolls down to reveal it on its next focus. Every other return to Path
// restores the previous scroll position instead.
interface PathScrollState {
  jumpToBottom: boolean;
  requestJumpToBottom: () => void;
  clearJump: () => void;
}

export const usePathScrollStore = create<PathScrollState>((set) => ({
  jumpToBottom: false,
  requestJumpToBottom: () => set({ jumpToBottom: true }),
  clearJump: () => set({ jumpToBottom: false }),
}));
