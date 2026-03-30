export function normalizeIndianPhone(value) {
  return String(value || "").replace(/\D/g, "").slice(0, 10);
}

export function isValidIndianPhone(phone) {
  return /^[6-9]\d{9}$/.test(String(phone || ""));
}

export function validatePasswordStrength(password) {
  const value = String(password || "");
  if (value.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(value)) return "Password must contain at least 1 uppercase letter.";
  if (!/[a-z]/.test(value)) return "Password must contain at least 1 lowercase letter.";
  if (!/\d/.test(value)) return "Password must contain at least 1 number.";
  if (!/[!@#$%^&*()_\-+=[\]{};':"\\|,.<>/?`~]/.test(value)) {
    return "Password must contain at least 1 special character.";
  }
  return null;
}
