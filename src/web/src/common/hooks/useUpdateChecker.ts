import { useCallback, useEffect, useRef, useState } from "react";
import { client } from "src/lib/client";
import type { VersionInfo } from "src/lib/resources/system";

const CHECK_INTERVAL_MS = 60_000; // 1 minute

interface UpdateCheckerState {
  versionInfo: VersionInfo | null;
  isUpdating: boolean;
  updateError: string | null;
  dismissedVersion: string | null;
  channelLoading: boolean;
}

export function useUpdateChecker() {
  const [state, setState] = useState<UpdateCheckerState>({
    versionInfo: null,
    isUpdating: false,
    updateError: null,
    dismissedVersion: null,
    channelLoading: false,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkVersion = useCallback(async () => {
    try {
      const info = await client.system.getVersion();
      setState((prev) => ({ ...prev, versionInfo: info }));
    } catch {
      // silently ignore — server may be restarting
    }
  }, []);

  useEffect(() => {
    // Initial check
    checkVersion();

    // Poll every minute
    intervalRef.current = setInterval(checkVersion, CHECK_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [checkVersion]);

  const dismiss = useCallback((version: string) => {
    setState((prev) => ({ ...prev, dismissedVersion: version }));
  }, []);

  const triggerUpdate = useCallback(async () => {
    setState((prev) => ({ ...prev, isUpdating: true, updateError: null }));
    try {
      await client.system.triggerUpdate();
      // Server will restart — show a "restarting" message
      setState((prev) => ({
        ...prev,
        isUpdating: false,
        updateError: null,
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Update failed";
      setState((prev) => ({ ...prev, isUpdating: false, updateError: message }));
    }
  }, []);

  const toggleChannel = useCallback(async (enabled: boolean) => {
    const newChannel = enabled ? "dev" : "stable";
    setState((prev) => ({ ...prev, channelLoading: true }));
    try {
      await client.system.setUpdateChannel(newChannel);
      // Re-check version immediately with new channel
      const info = await client.system.getVersion();
      setState((prev) => ({
        ...prev,
        versionInfo: info,
        channelLoading: false,
        dismissedVersion: null, // reset dismissal when channel changes
      }));
    } catch {
      setState((prev) => ({ ...prev, channelLoading: false }));
    }
  }, []);

  const showBanner = state.versionInfo?.hasUpdate === true && state.versionInfo.latest !== state.dismissedVersion;

  return {
    versionInfo: state.versionInfo,
    showBanner,
    isUpdating: state.isUpdating,
    updateError: state.updateError,
    channelLoading: state.channelLoading,
    dismiss,
    triggerUpdate,
    toggleChannel,
  };
}
