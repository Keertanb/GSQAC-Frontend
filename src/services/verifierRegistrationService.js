import axiosInstance from "../config/axios";
import { useQuery } from "@tanstack/react-query";

export async function registerVerifier(payload) {
  const response = await axiosInstance.post(
    "/verifier-registration/register",
    payload,
  );
  return response.data;
}

export function resolveLocalFileName(file) {
  if (!file) return null;
  return file.name || null;
}

export async function getVerifierRegistrations(params = {}) {
  const response = await axiosInstance.get("/verifier-registration/list", {
    params: {
      page: params.page ?? 0,
      limit: params.limit ?? 20,
      search: params.search || undefined,
    },
  });
  return response.data;
}

export function useGetVerifierRegistrationsQuery(params = {}, options = {}) {
  return useQuery({
    queryKey: [
      "admin",
      "verifier-registrations",
      params.page,
      params.limit,
      params.search,
    ],
    queryFn: () => getVerifierRegistrations(params),
    staleTime: 60 * 1000,
    ...options,
  });
}
