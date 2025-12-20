import { useMutation } from "@tanstack/react-query";
import axiosInstance from "../config/axios";
import { queryKeys } from "../config/queryClient";

/**
 * Send OTP to user
 * @param {Object} payload - { userName: string }
 * @returns {Promise} API response
 */
export const sendOtp = async (payload) => {
  const response = await axiosInstance.post("/auth/send-otp", payload);
  return response.data;
};

/**
 * Verify OTP (Login)
 * @param {Object} payload - { userId: number, otp: string }
 * @returns {Promise} API response
 */
export const verifyOtp = async (payload) => {
  const response = await axiosInstance.post("/auth/login", payload);
  return response.data;
};

/**
 * Logout user
 * @returns {Promise} API response
 */
export const logout = async () => {
  const response = await axiosInstance.post("/auth/logout");
  return response.data;
};

/**
 * React Query hook for sending OTP
 * @param {Object} options - Mutation options
 * @returns {Object} Mutation object from React Query
 */
export const useSendOtpMutation = (options = {}) => {
  return useMutation({
    mutationFn: (data) => sendOtp(data),
    mutationKey: queryKeys.auth.sendOtp(),
    ...options,
  });
};

/**
 * React Query hook for verifying OTP
 * @param {Object} options - Mutation options
 * @returns {Object} Mutation object from React Query
 */
export const useVerifyOtpMutation = (options = {}) => {
  return useMutation({
    mutationFn: (data) => verifyOtp(data),
    mutationKey: queryKeys.auth.verifyOtp(),
    ...options,
  });
};

/**
 * React Query hook for logout
 * @param {Object} options - Mutation options
 * @returns {Object} Mutation object from React Query
 */
export const useLogoutMutation = (options = {}) => {
  return useMutation({
    mutationFn: () => logout(),
    mutationKey: queryKeys.auth.logout(),
    ...options,
  });
};
