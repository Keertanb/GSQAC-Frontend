import axiosInstance from "../config/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { enqueueSnackbar } from "notistack";
import { uploadFileToPresignedUrl } from "./evidenceService";

const CONTENT_TYPE_BY_EXT = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

async function uploadLandingFile(file, uploadType, allowedExtensions) {
  if (!file) return null;

  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  if (!allowedExtensions.includes(extension)) {
    throw new Error(
      `Invalid file type. Allowed: ${allowedExtensions.join(", ").toUpperCase()}.`,
    );
  }

  const maxBytes =
    uploadType === "importantDocuments" ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error(
      `File exceeds the maximum allowed size of ${maxBytes / (1024 * 1024)} MB.`,
    );
  }

  const contentType =
    file.type || CONTENT_TYPE_BY_EXT[extension] || "application/octet-stream";

  const response = await axiosInstance.post(
    "/common/get-upload-url",
    {
      extension,
      contentType,
      uploadType,
    },
    { timeout: 90000 },
  );

  const uploadPayload = response?.data?.data || response?.data;
  if (!uploadPayload?.uploadURL || !uploadPayload?.fileName) {
    throw new Error("Unable to prepare file upload.");
  }

  await uploadFileToPresignedUrl(uploadPayload.uploadURL, file);
  return uploadPayload.fileName;
}

export async function uploadNewsImage(file) {
  return uploadLandingFile(file, "latestNews", ["jpg", "jpeg", "png", "webp"]);
}

export async function uploadImportantDocument(file) {
  return uploadLandingFile(file, "importantDocuments", [
    "pdf",
    "jpg",
    "jpeg",
    "png",
    "doc",
    "docx",
  ]);
}

export async function getPublicNews() {
  const response = await axiosInstance.get("/landing/news");
  return response.data;
}

export async function getAdminNews() {
  const response = await axiosInstance.get("/landing/admin/news");
  return response.data;
}

export async function upsertNews(payload) {
  const response = await axiosInstance.post("/landing/admin/news", payload);
  return response.data;
}

export async function deleteNews(newsId) {
  const response = await axiosInstance.delete(`/landing/admin/news/${newsId}`);
  return response.data;
}

export async function getPublicDocuments() {
  const response = await axiosInstance.get("/landing/documents");
  return response.data;
}

export async function getAdminDocuments() {
  const response = await axiosInstance.get("/landing/admin/documents");
  return response.data;
}

export async function upsertDocument(payload) {
  const response = await axiosInstance.post("/landing/admin/documents", payload);
  return response.data;
}

export async function deleteDocument(documentId) {
  const response = await axiosInstance.delete(
    `/landing/admin/documents/${documentId}`,
  );
  return response.data;
}

export function usePublicNewsQuery(options = {}) {
  return useQuery({
    queryKey: ["landing", "news", "public"],
    queryFn: getPublicNews,
    staleTime: 60 * 1000,
    ...options,
  });
}

export function useAdminNewsQuery(options = {}) {
  return useQuery({
    queryKey: ["landing", "news", "admin"],
    queryFn: getAdminNews,
    staleTime: 30 * 1000,
    ...options,
  });
}

export function useUpsertNewsMutation(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: upsertNews,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["landing", "news"] });
      enqueueSnackbar(data?.message || "News saved", { variant: "success" });
      options.onSuccess?.(data);
    },
    onError: (error) => {
      enqueueSnackbar(
        error?.response?.data?.message || error.message || "Failed to save news",
        { variant: "error" },
      );
      options.onError?.(error);
    },
  });
}

export function useDeleteNewsMutation(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteNews,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["landing", "news"] });
      enqueueSnackbar(data?.message || "News deleted", { variant: "success" });
      options.onSuccess?.(data);
    },
    onError: (error) => {
      enqueueSnackbar(
        error?.response?.data?.message ||
          error.message ||
          "Failed to delete news",
        { variant: "error" },
      );
      options.onError?.(error);
    },
  });
}

export function usePublicDocumentsQuery(options = {}) {
  return useQuery({
    queryKey: ["landing", "documents", "public"],
    queryFn: getPublicDocuments,
    staleTime: 60 * 1000,
    ...options,
  });
}

export function useAdminDocumentsQuery(options = {}) {
  return useQuery({
    queryKey: ["landing", "documents", "admin"],
    queryFn: getAdminDocuments,
    staleTime: 30 * 1000,
    ...options,
  });
}

export function useUpsertDocumentMutation(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: upsertDocument,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["landing", "documents"] });
      enqueueSnackbar(data?.message || "Document saved", { variant: "success" });
      options.onSuccess?.(data);
    },
    onError: (error) => {
      enqueueSnackbar(
        error?.response?.data?.message ||
          error.message ||
          "Failed to save document",
        { variant: "error" },
      );
      options.onError?.(error);
    },
  });
}

export function useDeleteDocumentMutation(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteDocument,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["landing", "documents"] });
      enqueueSnackbar(data?.message || "Document deleted", {
        variant: "success",
      });
      options.onSuccess?.(data);
    },
    onError: (error) => {
      enqueueSnackbar(
        error?.response?.data?.message ||
          error.message ||
          "Failed to delete document",
        { variant: "error" },
      );
      options.onError?.(error);
    },
  });
}
