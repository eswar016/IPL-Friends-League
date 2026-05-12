"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { forceSyncAction, toggleAutoSyncAction, forcePointsSyncAction } from "@/app/actions/sync";

interface ManualSyncButtonProps {
  initialAutoSync: boolean;
  apiCallCount: number;
}

export const ManualSyncButton = ({ initialAutoSync, apiCallCount }: ManualSyncButtonProps) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [autoSync, setAutoSync] = useState(initialAutoSync);
  const router = useRouter();

  const handleSync = async (forceSchedule: boolean) => {
    try {
      setIsSyncing(true);
      const res = await forceSyncAction(forceSchedule);
      if (!res.success) {
        throw new Error(`Sync failed: ${res.error}`);
      }
      // Revalidate data after successful sync
      router.refresh();
    } catch (error) {
      console.error("Manual sync error:", error);
      alert("Failed to sync manually. Check console for details.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePointsSync = async () => {
    try {
      setIsSyncing(true);
      const res = await forcePointsSyncAction();
      if (!res.success) {
        throw new Error(`Points sync failed: ${res.error}`);
      }
      router.refresh();
    } catch (error) {
      console.error("Points sync error:", error);
      alert("Failed to sync points explicitly.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleToggle = async () => {
    try {
      setIsSyncing(true);
      const res = await toggleAutoSyncAction();
      if (res.success && typeof res.enabled === "boolean") {
        setAutoSync(res.enabled);
        router.refresh();
      } else {
        throw new Error(res.error ?? "Failed to toggle");
      }
    } catch (error) {
      console.error("Auto-sync toggle error:", error);
      alert("Failed to toggle Auto-Sync.");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-[rgba(135,160,210,0.1)] pt-3">
      <div className="flex items-center justify-between rounded bg-[rgba(10,18,36,0.6)] px-3 py-2 border border-[rgba(135,160,210,0.12)]">
        <div className="flex flex-col">
          <span className="text-[11px] font-bold text-[var(--accent-gold)]">Smart Auto-Sync</span>
          <span className="text-[9px] text-[var(--text-muted)]">Pings standard/double-header windows</span>
        </div>
        <button
          onClick={handleToggle}
          disabled={isSyncing}
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            autoSync ? "bg-[#4ade80]" : "bg-gray-600"
          } disabled:cursor-not-allowed disabled:opacity-50`}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              autoSync ? "translate-x-4" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => handleSync(false)}
            disabled={isSyncing}
            className="rounded bg-[var(--accent-primary)] px-3 py-1.5 text-[11px] font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSyncing ? "Syncing..." : "Sync Scores & Points"}
          </button>

          <button
            onClick={() => handleSync(true)}
            disabled={isSyncing}
            className="rounded border border-[var(--accent-primary)] bg-transparent px-3 py-1.5 text-[11px] font-medium text-[var(--accent-primary)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSyncing ? "Syncing..." : "Force Schedule Fetch"}
          </button>
        </div>
        <div className="text-right">
          <span className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">API Calls</span>
          <p className="font-mono text-[11px] font-bold text-[#ffb489]">{apiCallCount}</p>
        </div>
      </div>
      
      <div className="flex justify-between items-center mt-2">
        <button
          onClick={handlePointsSync}
          disabled={isSyncing}
          className="rounded border border-[var(--accent-gold)] bg-[rgba(255,180,137,0.1)] px-3 py-1 text-[10px] font-medium text-[var(--accent-gold)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSyncing ? "Syncing..." : "Force Sync Points Table"}
        </button>
        <div className="text-[10px] text-[var(--text-muted)] font-mono">v1.0.1</div>
      </div>
    </div>
  );
};
