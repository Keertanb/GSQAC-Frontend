import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      role: null,
      userId: null,
      userName: null,

      setUserData: (userData, token, role, userId, userName) => {
        set({
          user: userData,
          token,
          role,
          userId,
          userName,
        });
      },

      setOtpUserId: (userId, role) => {
        set({
          userId,
          role,
        });
      },

      logout: () => {
        set({
          user: null,
          token: null,
          role: null,
          userId: null,
          userName: null,
        });
      },

      isAuthenticated: () => {
        const state = useAuthStore.getState();
        return !!(state.user && state.token);
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useAuthStore;
