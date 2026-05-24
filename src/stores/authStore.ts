import { create } from 'zustand';

interface AuthState {
  userId: string;
  email: string | null;
  setUser: (id: string, email: string | null) => void;
}

export const LOCAL_USER_ID = 'local-user';

export const useAuthStore = create<AuthState>((set) => ({
  userId: LOCAL_USER_ID,
  email: null,
  setUser: (userId, email) => set({ userId, email }),
}));
