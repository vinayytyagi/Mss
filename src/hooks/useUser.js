"use client";

import { useAuthUser } from "@/lib/authCookies";

/**
 * Simple alias hook for user state.
 * Keeps components decoupled from authCookies implementation details.
 */
export function useUser() {
  return useAuthUser();
}

