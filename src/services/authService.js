import { useMutation } from "@tanstack/react-query";
import axiosInstance from "../config/axios";
import { queryKeys } from "../config/queryClient";

/**
 * Send OTP to user
 * @param {Object} payload - { userName: string, roleId: number }
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
 * Reset password
 * @param {Object} payload - { userName: string, roleId: number, newPassword: string, confirmPassword: string, oldPassword?: string }
 * @returns {Promise} API response
 */
export const resetPassword = async (payload) => {
  const response = await axiosInstance.post("/auth/reset-password", payload);
  return response.data;
};

/**
 * Send OTP for school password reset
 * @param {Object} payload - { userName: string, roleId: string, mobileNo: string }
 * @returns {Promise} API response
 */
export const sendSchoolOtp = async (payload) => {
  const response = await axiosInstance.post("/school/send-otp", payload);
  return response.data;
};

/**
 * Reset school password with OTP
 * @param {Object} payload - { id: number, otpCode: string, userName: string, password: string }
 * @returns {Promise} API response
 */
export const resetSchoolPassword = async (payload) => {
  const response = await axiosInstance.post("/school/reset-password", payload);
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
 * React Query hook for reset password
 * @param {Object} options - Mutation options
 * @returns {Object} Mutation object from React Query
 */
export const useResetPasswordMutation = (options = {}) => {
  return useMutation({
    mutationFn: (data) => resetPassword(data),
    mutationKey: queryKeys.auth.resetPassword(),
    ...options,
  });
};

/**
 * React Query hook for sending school reset OTP
 * @param {Object} options - Mutation options
 * @returns {Object} Mutation object from React Query
 */
export const useSendSchoolOtpMutation = (options = {}) => {
  return useMutation({
    mutationFn: (data) => sendSchoolOtp(data),
    mutationKey: queryKeys.auth.schoolSendOtp(),
    ...options,
  });
};

/**
 * React Query hook for school password reset with OTP
 * @param {Object} options - Mutation options
 * @returns {Object} Mutation object from React Query
 */
export const useSchoolResetPasswordMutation = (options = {}) => {
  return useMutation({
    mutationFn: (data) => resetSchoolPassword(data),
    mutationKey: queryKeys.auth.schoolResetPassword(),
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
