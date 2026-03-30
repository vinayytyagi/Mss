import { apiFetch } from "./apiClient";

export async function uploadOracleImage({ fileBase64, mimeType, originalName }, { signal } = {}) {
  return apiFetch("/oracle-upload", {
    cacheMode: "no-store",
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileBase64, mimeType, originalName }),
    signal,
  });
}
