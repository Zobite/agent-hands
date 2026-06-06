import { message } from "antd";
import { useCallback, useEffect, useRef, useState } from "react";
import { client } from "src/lib/client";
import type { SystemInfo } from "src/lib/resources/system";

const POLL_INTERVAL = 5000; // 5 seconds

export function useSystemInfo() {
  const [data, setData] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchInfo = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const info = await client.system.getSystemInfo();
      setData(info);
      setError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to fetch system info";
      setError(msg);
      if (!silent) message.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchInfo();
  }, [fetchInfo]);

  // Auto-refresh polling
  useEffect(() => {
    if (!autoRefresh) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      fetchInfo(true); // silent refresh
    }, POLL_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [autoRefresh, fetchInfo]);

  return {
    data,
    loading,
    error,
    autoRefresh,
    setAutoRefresh,
    refresh: () => fetchInfo(false),
  };
}
