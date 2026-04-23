import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      // Avoid long "pending" state on poor/no network.
      networkMode: "always",
      retry: (failureCount, error) => {
        // Do not retry network/timeout errors; fail fast so UI can show error.
        if (error?.code === "ECONNABORTED" || !error?.response) return false;
        // Keep one retry for server errors (5xx) only.
        const status = error?.response?.status;
        return failureCount < 1 && status >= 500;
      },
      staleTime: 5 * 60 * 1000,
    },
    mutations: {
      networkMode: "always",
    },
  },
});
