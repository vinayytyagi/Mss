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

export async function registerWithPhonePassword(payload, { idempotencyKey } = {}) {
  return apiPost("/auth/user/register-phone", { payload, idempotencyKey });
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

/**
 * Google sign-in: POST the Google ID-token credential. Returns either a full
 * session { token, user } (existing user with a phone) or { needs_phone:true,
 * pending_token } for a new Google user who must add a mobile number.
 */
export async function googleAuth(credential, { idempotencyKey } = {}) {
  return apiPost("/auth/user/google", { payload: { credential }, idempotencyKey });
}

/** Complete a Google signup by attaching a mobile number → returns { token, user }. */
export async function completeGooglePhone(payload, { idempotencyKey } = {}) {
  return apiPost("/auth/user/google/complete-phone", { payload, idempotencyKey });
}
