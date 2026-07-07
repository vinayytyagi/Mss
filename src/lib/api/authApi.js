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

/**
 * Log in with either a 10-digit Indian phone OR an email, plus password.
 * The backend resolves the account by whichever form `identifier` takes.
 *
 * Intentionally NOT idempotency-cached: login is safe to retry, and caching
 * the auth response in localStorage caused stale/empty replays (a prior
 * bucket's record being returned after logout) that looked like a successful
 * login without actually establishing a session.
 */
export async function loginUser(identifier, password) {
  return apiPost("/auth/user/login", {
    payload: { identifier, password },
  });
}

/**
 * Forgot-password (email-link flow, mirrors vendor): emails a single-use
 * reset link that expires in 30 minutes.
 */
export async function requestPasswordResetLink(email, { idempotencyKey } = {}) {
  return apiPost("/auth/user/forgot-password/request", {
    payload: { email },
    idempotencyKey,
  });
}

/** Consume the email-link token and set a new password. payload: { token, newPassword }. */
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
