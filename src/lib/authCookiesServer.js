import { cookies } from "next/headers";

const TOKEN_COOKIE = "mss_token";
const USER_COOKIE = "mss_user";

export async function getAuthTokenServer() {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE)?.value;
  if (!token) return null;

  try {
    return decodeURIComponent(token);
  } catch {
    return token;
  }
}

export async function getAuthUserServer() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(USER_COOKIE)?.value;
  if (!raw) return null;

  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    decoded = raw;
  }

  try {
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}
