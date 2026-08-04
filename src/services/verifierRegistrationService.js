import axiosInstance from "../config/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { enqueueSnackbar } from "notistack";

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

export async function getVerifierRegistrationStatus() {
  const response = await axiosInstance.get("/verifier-registration/status");
  return response.data;
}

export async function updateVerifierRegistrationStatus(payload) {
  const response = await axiosInstance.put(
    "/verifier-registration/status",
    payload,
  );
  return response.data;
}

export function useGetVerifierRegistrationStatusQuery(options = {}) {
  return useQuery({
    queryKey: ["verifier-registration", "status"],
    queryFn: getVerifierRegistrationStatus,
    staleTime: 30 * 1000,
    ...options,
  });
}

export function useUpdateVerifierRegistrationStatusMutation(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateVerifierRegistrationStatus,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: ["verifier-registration", "status"],
      });
      enqueueSnackbar(
        data?.message || "Verifier registration status updated successfully",
        { variant: "success" },
      );
      options.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      enqueueSnackbar(
        error?.response?.data?.message ||
          "Failed to update verifier registration status",
        { variant: "error" },
      );
      options.onError?.(error, variables, context);
    },
  });
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
