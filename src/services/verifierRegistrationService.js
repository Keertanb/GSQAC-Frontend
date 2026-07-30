import axiosInstance from "../config/axios";

/** Local file pick only — no get-upload-url / AWS upload for now. */
export function resolveLocalFileName(file) {
  if (!file) return null;
  return file.name || null;
}

export async function registerVerifier(payload) {
  const response = await axiosInstance.post(
    "/verifier-registration/register",
    payload,
  );
  return response.data;
}
