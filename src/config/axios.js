import axios from "axios";
import useAuthStore from "../store/useAuthStore";

// Base URL for API
const BASE_URL =
  "https://clement-untrammed-nonburdensomely.ngrok-free.app/api/v1";

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
    // Check for "Invalid token" message in successful responses
    if (response?.data?.message && typeof response.data.message === 'string') {
      const message = response.data.message.toLowerCase();
      if (message.includes("invalid token")) {
        useAuthStore.getState().logout();
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
        return Promise.reject(new Error("Invalid token"));
      }
    }
    return response;
  },
  async (error) => {
    const errorMessage = error.response?.data?.message;
    
    // Check for "Invalid token" message in error responses
    if (errorMessage && typeof errorMessage === 'string') {
      const message = errorMessage.toLowerCase();
      if (message.includes("invalid token")) {
        useAuthStore.getState().logout();
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }
    }

    if (error.response?.status === 401) {
      const { data } = error.response;

      if (
        data?.message?.includes("Token mismatch") ||
        data?.message?.includes("Token Invalid") ||
        data?.message?.includes("jwt expired") ||
        data?.message?.includes("Unauthorized") ||
        (data?.message && data.message.toLowerCase().includes("invalid token"))
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
