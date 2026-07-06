import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../config/axios";
import { enqueueSnackbar } from "notistack";

export const MAX_EVIDENCE_SIZE_BYTES = 5 * 1024 * 1024;
export const EVIDENCE_ACCEPT =
  "image/jpeg,image/jpg,image/png,application/pdf,.jpg,.jpeg,.png,.pdf";

export function subdomainRequiresEvidence(subdomain) {
  const value = subdomain?.requireEvidence;
  return value === 1 || value === "1" || value === true;
}

export const getSubdomainEvidence = async (params) => {
  const response = await axiosInstance.get("/common/subdomain-evidence", {
    params,
  });
  return response.data;
};

export const prepareSubdomainEvidenceUpload = async (payload) => {
  const response = await axiosInstance.post(
    "/common/subdomain-evidence/prepare-upload",
    payload,
  );
  return response.data;
};

export function useSubdomainEvidenceQuery(
  { subDomainId, schoolId },
  enabled = true,
) {
  return useQuery({
    queryKey: ["subdomain-evidence", subDomainId, schoolId],
    queryFn: () => getSubdomainEvidence({ subDomainId, schoolId }),
    enabled: enabled && !!subDomainId && !!schoolId,
    staleTime: 30 * 1000,
  });
}

export function usePrepareSubdomainEvidenceMutation(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: prepareSubdomainEvidenceUpload,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          "subdomain-evidence",
          variables.subDomainId,
          variables.schoolId,
        ],
      });
      enqueueSnackbar(
        data?.message || "Evidence uploaded successfully.",
        { variant: "success" },
      );
      options.onSuccess?.(data, variables);
    },
    onError: (error) => {
      enqueueSnackbar(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to upload evidence.",
        { variant: "error" },
      );
      options.onError?.(error);
    },
  });
}

export async function uploadFileToPresignedUrl(uploadURL, file) {
  const response = await fetch(uploadURL, {
    method: "PUT",
    headers: {
      "Content-Type": file.type || "application/octet-stream",
    },
    body: file,
  });

  if (!response.ok) {
    throw new Error(`Upload failed with status ${response.status}`);
  }
}
