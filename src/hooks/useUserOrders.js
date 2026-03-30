"use client";

import { useCallback, useState } from "react";
import { getAuthToken, useAuthUser } from "@/lib/authCookies";
import { fetchMyOrders } from "@/lib/api";

export function useUserOrders({ initialOrders = [] } = {}) {
  const user = useAuthUser();
  const [orders, setOrders] = useState(initialOrders);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!user) return;
    const token = getAuthToken();
    if (!token) return;

    setError("");
    try {
      const data = await fetchMyOrders(token);
      setOrders(data.orders || []);
    } catch (e) {
      setError(e.message || "Failed to refresh orders");
    }
  }, [user]);

  return { orders, error, refresh, setOrders };
}

