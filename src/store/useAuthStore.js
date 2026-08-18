import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  clearAuthToken,
  getAuthToken,
  hydrateAuthToken,
  setAuthToken,
} from "../utils/authToken";
import { migrateLegacyAuthStorage } from "../utils/migrateLegacyAuthStorage";

migrateLegacyAuthStorage();
hydrateAuthToken();

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: getAuthToken(),
      role: null,
      userId: null,
      userName: null,
      districtId: null,

      setUserData: (userData, token, role, userId, userName, districtId) => {
        setAuthToken(token);
        const parsedDistrictId = Number(districtId ?? userData?.districtId);
        set({
          user: userData,
          token,
          role,
          userId,
          userName,
          districtId:
            Number.isFinite(parsedDistrictId) && parsedDistrictId > 0
              ? parsedDistrictId
              : null,
        });
      },

      setOtpUserId: (userId, role) => {
        set({
          userId,
          role,
        });
      },

      logout: () => {
        clearAuthToken();
        set({
          user: null,
          token: null,
          role: null,
          userId: null,
          userName: null,
          districtId: null,
        });
      },

      isAuthenticated: () => {
        const state = useAuthStore.getState();
        return !!(state.user && getAuthToken());
      },
    }),
    {
      name: "gsqac-auth-session",
      // localStorage survives mobile app background kills; sessionStorage does not
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        role: state.role,
        userId: state.userId,
        userName: state.userName,
        districtId: state.districtId,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const token = getAuthToken();
        if (token) {
          useAuthStore.setState({ token });
        }
      },
    },
  ),
);

export default useAuthStore;
