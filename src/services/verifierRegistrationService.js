import axiosInstance from "../config/axios";
import { uploadFileToPresignedUrl } from "./evidenceService";

function getExtension(file) {
  const name = file?.name || "";
  const parts = name.split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "pdf";
}

export async function getVerifierRegistrationUploadUrl(file) {
  const response = await axiosInstance.post("/common/get-upload-url", {
    uploadType: "verifierRegistration",
    contentType: file.type || "application/octet-stream",
    extension: getExtension(file),
    fileName: undefined,
  });
  return response.data?.data || response.data;
}

export async function uploadVerifierRegistrationFile(file) {
  if (!file) return null;

  const uploadPayload = await getVerifierRegistrationUploadUrl(file);
  const uploadURL = uploadPayload?.uploadURL;
  const fileName = uploadPayload?.fileName;

  if (!uploadURL || !fileName) {
    throw new Error("Failed to get upload URL for document");
  }

  await uploadFileToPresignedUrl(uploadURL, file);
  return fileName;
}

export async function registerVerifier(payload) {
  const response = await axiosInstance.post(
    "/verifier-registration/register",
    payload,
  );
  return response.data;
}
