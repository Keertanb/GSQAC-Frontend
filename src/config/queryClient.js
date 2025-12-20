import { QueryClient } from "@tanstack/react-query";

export const queryKeys = {
  auth: {
    sendOtp: (userName) => ["auth", "send-otp", userName],
    verifyOtp: (userName, otp) => ["auth", "verify-otp", userName, otp],
    logout: () => ["auth", "logout"],
  },
};
