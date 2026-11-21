"use client";

import { useEffect, useState } from "react";
import { getBackendHealth, HealthData } from "@/lib/api";

export type ConnectionStatus = "loading" | "connected" | "disconnected";

export function useBackendHealth() {
  const [status, setStatus] = useState<ConnectionStatus>("loading");
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const checkStatus = async () => {
    const res = await getBackendHealth();
    if (res.success && res.data) {
      setStatus("connected");
      setHealthData(res.data);
      setErrorMessage(null);
    } else {
      setStatus("disconnected");
      setErrorMessage(res.error?.message || "Backend offline");
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return {
    status,
    healthData,
    errorMessage,
    refetch: checkStatus,
  };
}
