"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { forceSyncAction } from "@/app/actions/sync";

export const ManualSyncButton = () => {
  const [isSyncing, setIsSyncing] = useState(false);
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

  return (
    <div className="mt-3 flex gap-2">
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
  );
};
