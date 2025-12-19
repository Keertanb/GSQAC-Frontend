import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      role: null,
      userId: null,
      
      setUserData: (userData, token, role, userId) => {
        set({ 
          user: userData, 
          token,
          role,
          userId
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
          userId: null
        });
      },
      
      isAuthenticated: () => {
        const state = useAuthStore.getState();
        return !!(state.user && state.token);
      }
    }),
    { 
      name: 'auth-storage', 
      storage: createJSONStorage(() => localStorage) 
    }
  )
);

export default useAuthStore;

