import { create } from 'zustand';

const useStore = create((set) => ({
  // Add your state here
  user: null,
  setUser: (user) => set({ user }),
  
  // Example: theme, filters, etc.
  theme: 'light',
  setTheme: (theme) => set({ theme }),
}));

export default useStore;

