import { apiPost } from "./apiClient";

export async function requestUserOtp(phone, purpose = "signup", { idempotencyKey } = {}) {
  return apiPost("/auth/user/request-otp", {
    payload: { phone, purpose },
    idempotencyKey,
  });
}

export async function verifyUserOtp(phone, otp, purpose = "signup", { idempotencyKey } = {}) {
  return apiPost("/auth/user/verify-otp", {
    payload: { phone, otp, purpose },
    idempotencyKey,
  });
}

export async function signupUser(payload, { idempotencyKey } = {}) {
  return apiPost("/auth/user/signup", { payload, idempotencyKey });
}

export async function progressiveSave(payload, { idempotencyKey } = {}) {
  return apiPost("/auth/user/progressive-save", { payload, idempotencyKey });
}

export async function loginUser(phone, password, { idempotencyKey } = {}) {
  return apiPost("/auth/user/login", {
    payload: { phone, password },
    idempotencyKey,
  });
}

export async function requestResetOtp(phone, { idempotencyKey } = {}) {
  return apiPost("/auth/user/forgot-password/request-otp", {
    payload: { phone },
    idempotencyKey,
  });
}

export async function resetPassword(payload, { idempotencyKey } = {}) {
  return apiPost("/auth/user/forgot-password/reset", { payload, idempotencyKey });
}
