import axios from "axios";
import useAuthStore from "../store/useAuthStore";

// Base URL for API
const BASE_URL = "https://16sm2wqr-5000.inc1.devtunnels.ms/api/v1";

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const state = useAuthStore.getState();
    const token = state.token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // if (role) {
    //   const roleId = roleIdMap[role];
    //   if (roleId) {
    //     config.headers.roleId = roleId;
    //   }
    // }

    config.headers["Content-Type"] = "application/json";

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      const { data } = error.response;

      if (
        data?.message?.includes("Token mismatch") ||
        data?.message?.includes("Token Invalid") ||
        data?.message?.includes("jwt expired") ||
        data?.message?.includes("Unauthorized")
      ) {
        useAuthStore.getState().logout();

        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }

        return Promise.reject(error);
      }
    }

    if (error.response?.status === 403) {
      useAuthStore.getState().logout();
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
