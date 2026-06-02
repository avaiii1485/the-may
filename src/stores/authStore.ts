import { create } from 'zustand';

interface AuthState {
  userId: string;
  email: string | null;
  /** True while signed in anonymously (no real account yet). */
  isAnonymous: boolean;
  /** False until the initial session check completes (prevents an auth-gate flash). */
  initialized: boolean;
  /** True after a password-reset link is opened — show the "set new password" UI. */
  recovery: boolean;
  setUser: (id: string, email: string | null, isAnonymous: boolean) => void;
  setInitialized: (v: boolean) => void;
  setRecovery: (v: boolean) => void;
}

export const LOCAL_USER_ID = 'local-user';

export const useAuthStore = create<AuthState>((set) => ({
  userId: LOCAL_USER_ID,
  email: null,
  isAnonymous: false,
  initialized: false,
  recovery: false,
  setUser: (userId, email, isAnonymous) => set({ userId, email, isAnonymous }),
  setInitialized: (initialized) => set({ initialized }),
  setRecovery: (recovery) => set({ recovery }),
}));
