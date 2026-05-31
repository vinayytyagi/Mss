import { apiFetch, apiPost } from "./apiClient";

export async function uploadCareerResume({ fileBase64, mimeType, originalName }, { signal } = {}) {
  return apiFetch("/careers/resume-upload", {
    cacheMode: "no-store",
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileBase64, mimeType, originalName }),
    signal,
  });
}

export async function submitCareerApplication(payload) {
  return apiPost("/careers/apply", {
    payload,
    cacheMode: "no-store",
  });
}
