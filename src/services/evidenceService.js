import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../config/axios";
import { enqueueSnackbar } from "notistack";

export const MAX_EVIDENCE_SIZE_BYTES = 5 * 1024 * 1024;
export const EVIDENCE_ACCEPT =
  "image/jpeg,image/jpg,image/png,application/pdf,.jpg,.jpeg,.png,.pdf";

export function subdomainRequiresEvidence(subdomain) {
  if ((subdomain?.evidenceSlots || []).length > 0) return true;
  const value = subdomain?.requireEvidence;
  return value === 1 || value === "1" || value === true;
}

export function getEvidenceSlotName(slot, language = "en") {
  if (!slot) return "";
  switch (language) {
    case "gu":
      return slot.slotNameGu || slot.slotName || slot.slotNameEn || "";
    case "hi":
      return slot.slotNameHi || slot.slotName || slot.slotNameEn || "";
    default:
      return slot.slotNameEn || slot.slotName || slot.slotNameGu || "";
  }
}

export function computeMandatoryEvidenceProgress(slots = [], summary = null) {
  if (summary?.mandatoryTotal != null) {
    const mandatoryTotal = Number(summary.mandatoryTotal) || 0;
    const mandatoryUploaded = Number(summary.mandatoryUploaded) || 0;
    return {
      total: mandatoryTotal,
      uploaded: mandatoryUploaded,
      remaining: Math.max(0, mandatoryTotal - mandatoryUploaded),
      percentage:
        mandatoryTotal > 0
          ? Math.round((mandatoryUploaded / mandatoryTotal) * 100)
          : 100,
    };
  }

  const mandatorySlots = (slots || []).filter(
    (slot) =>
      slot.isMandatory === 1 ||
      slot.isMandatory === true ||
      slot.isMandatory === "1",
  );
  const uploaded = mandatorySlots.filter((slot) => slot.evidence?.evidenceId)
    .length;

  return {
    total: mandatorySlots.length,
    uploaded,
    remaining: Math.max(0, mandatorySlots.length - uploaded),
    percentage:
      mandatorySlots.length > 0
        ? Math.round((uploaded / mandatorySlots.length) * 100)
        : 100,
  };
}

export function getSubdomainEvidenceProgress(subdomain) {
  if (!subdomainRequiresEvidence(subdomain)) {
    return { total: 0, uploaded: 0, remaining: 0, percentage: 100 };
  }

  const mandatoryTotal =
    Number(subdomain.mandatoryEvidenceTotal) ||
    (subdomain.evidenceSlots || []).filter(
      (slot) =>
        slot.isMandatory === 1 ||
        slot.isMandatory === true ||
        slot.isMandatory === "1",
    ).length;

  const mandatoryUploaded =
    Number(subdomain.mandatoryEvidenceUploaded) ||
    (subdomain.evidenceSlots || []).filter(
      (slot) =>
        (slot.isMandatory === 1 ||
          slot.isMandatory === true ||
          slot.isMandatory === "1") &&
        slot.evidence?.evidenceId,
    ).length;

  return {
    total: mandatoryTotal,
    uploaded: mandatoryUploaded,
    remaining: Math.max(0, mandatoryTotal - mandatoryUploaded),
    percentage:
      mandatoryTotal > 0
        ? Math.round((mandatoryUploaded / mandatoryTotal) * 100)
        : 100,
  };
}

export function getDomainMandatoryEvidenceProgress(domain) {
  let total = 0;
  let uploaded = 0;

  (domain?.subDomain || []).forEach((subdomain) => {
    const progress = getSubdomainEvidenceProgress(subdomain);
    total += progress.total;
    uploaded += progress.uploaded;
  });

  return {
    total,
    uploaded,
    remaining: Math.max(0, total - uploaded),
    percentage: total > 0 ? Math.round((uploaded / total) * 100) : 100,
    isComplete: total === 0 || uploaded >= total,
  };
}

export function getAssessmentMandatoryEvidenceProgress(domains = []) {
  let total = 0;
  let uploaded = 0;

  domains.forEach((domain) => {
    (domain.subDomain || []).forEach((subdomain) => {
      const progress = getSubdomainEvidenceProgress(subdomain);
      total += progress.total;
      uploaded += progress.uploaded;
    });
  });

  return {
    total,
    uploaded,
    remaining: Math.max(0, total - uploaded),
    percentage: total > 0 ? Math.round((uploaded / total) * 100) : 100,
    isComplete: total === 0 || uploaded >= total,
  };
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

export const getEvidenceSlots = async (params) => {
  const response = await axiosInstance.get("/questionnaire/evidence-slots", {
    params,
  });
  return response.data;
};

export const upsertEvidenceSlot = async (payload) => {
  const response = await axiosInstance.post(
    "/questionnaire/evidence-slots",
    payload,
  );
  return response.data;
};

export const deleteEvidenceSlot = async (evidenceSlotId) => {
  const response = await axiosInstance.delete("/questionnaire/evidence-slots", {
    params: { evidenceSlotId },
  });
  return response.data;
};

export function useSubdomainEvidenceQuery(
  { subDomainId, schoolId, languageCode },
  enabled = true,
) {
  return useQuery({
    queryKey: ["subdomain-evidence", subDomainId, schoolId, languageCode],
    queryFn: () =>
      getSubdomainEvidence({ subDomainId, schoolId, languageCode }),
    enabled: enabled && !!subDomainId && !!schoolId,
    staleTime: 30 * 1000,
  });
}

export function useEvidenceSlotsQuery(subDomainId, enabled = true) {
  return useQuery({
    queryKey: ["evidence-slots", subDomainId],
    queryFn: () => getEvidenceSlots({ subDomainId }),
    enabled: enabled && !!subDomainId,
    staleTime: 30 * 1000,
  });
}

function patchSubdomainEvidenceInDomains(domains, subDomainId, progress) {
  if (!Array.isArray(domains)) return domains;

  const targetId = Number(subDomainId);
  const total = Number(progress?.total) || 0;
  const uploaded = Number(progress?.uploaded) || 0;
  const remaining = Math.max(0, total - uploaded);
  let changed = false;

  const nextDomains = domains.map((domain) => ({
    ...domain,
    subDomain: (domain.subDomain || []).map((subdomain) => {
      const currentId = Number(subdomain.subDomainId || subdomain.id);
      if (currentId !== targetId) return subdomain;

      if (
        Number(subdomain.mandatoryEvidenceTotal) === total &&
        Number(subdomain.mandatoryEvidenceUploaded) === uploaded
      ) {
        return subdomain;
      }

      changed = true;
      return {
        ...subdomain,
        mandatoryEvidenceTotal: total,
        mandatoryEvidenceUploaded: uploaded,
        mandatoryEvidenceRemaining: remaining,
        mandatoryEvidencePercentage:
          total > 0 ? Math.round((uploaded / total) * 100) : 100,
      };
    }),
  }));

  return changed ? nextDomains : domains;
}

function patchDomainsResponseSubdomainEvidence(oldData, subDomainId, progress) {
  if (!oldData) return oldData;

  if (Array.isArray(oldData.data)) {
    if (oldData.data.length > 0 && oldData.data[0]?.domains) {
      let changed = false;
      const nextData = oldData.data.map((assessment) => {
        const nextDomains = patchSubdomainEvidenceInDomains(
          assessment.domains,
          subDomainId,
          progress,
        );
        if (nextDomains === assessment.domains) return assessment;
        changed = true;
        return { ...assessment, domains: nextDomains };
      });
      return changed ? { ...oldData, data: nextData } : oldData;
    }

    const nextDomains = patchSubdomainEvidenceInDomains(
      oldData.data,
      subDomainId,
      progress,
    );
    return nextDomains === oldData.data
      ? oldData
      : { ...oldData, data: nextDomains };
  }

  return oldData;
}

export function updateDomainsCacheSubdomainEvidence(
  queryClient,
  subDomainId,
  progress,
) {
  if (!queryClient || !subDomainId || !progress?.total) return;

  const patcher = (oldData) =>
    patchDomainsResponseSubdomainEvidence(oldData, subDomainId, progress);

  ["school", "verifier", "crc"].forEach((scope) => {
    queryClient.setQueriesData({ queryKey: [scope, "domains"] }, patcher);
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
      queryClient.invalidateQueries({ queryKey: ["questionnaire", "domain"] });
      queryClient.invalidateQueries({ queryKey: ["school", "domains"] });
      queryClient.invalidateQueries({ queryKey: ["verifier", "domains"] });
      queryClient.invalidateQueries({ queryKey: ["crc", "domains"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "domains"] });
      enqueueSnackbar(data?.message || "Evidence uploaded successfully.", {
        variant: "success",
      });
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

export function useUpsertEvidenceSlotMutation(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: upsertEvidenceSlot,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["evidence-slots", variables.subDomainId],
      });
      queryClient.invalidateQueries({ queryKey: ["admin", "domains"] });
      enqueueSnackbar(data?.message || "Evidence slot saved.", {
        variant: "success",
      });
      options.onSuccess?.(data, variables);
    },
    onError: (error) => {
      enqueueSnackbar(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to save evidence slot.",
        { variant: "error" },
      );
      options.onError?.(error);
    },
  });
}

export function useDeleteEvidenceSlotMutation(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteEvidenceSlot,
    onSuccess: (data, evidenceSlotId) => {
      queryClient.invalidateQueries({ queryKey: ["evidence-slots"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "domains"] });
      enqueueSnackbar(data?.message || "Evidence slot removed.", {
        variant: "success",
      });
      options.onSuccess?.(data, evidenceSlotId);
    },
    onError: (error) => {
      enqueueSnackbar(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to delete evidence slot.",
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
