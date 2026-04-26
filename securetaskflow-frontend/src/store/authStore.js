import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      // Actions
      setTokens: (accessToken, refreshToken) => {
        set({ accessToken, refreshToken, isAuthenticated: true });
      },

      setUser: (user) => {
        set({ user });
      },

      login: (authResponse) => {
        set({
          accessToken: authResponse.accessToken,
          refreshToken: authResponse.refreshToken,
          user: authResponse.user,
          isAuthenticated: true,
        });
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      isSuperAdmin: () => {
        return get().user?.systemRole === 'SUPER_ADMIN';
      },
    }),
    {
      name: 'auth-storage', // localStorage key
      partialize: (state) => ({
        // Only persist tokens and user — not actions
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;