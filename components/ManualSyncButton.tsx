"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export const ManualSyncButton = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const router = useRouter();

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      const res = await fetch("/api/internal/sync?force=true", {
        method: "POST",
      });
      if (!res.ok) {
        throw new Error(`Sync failed with status: ${res.status}`);
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
    <div className="mt-3">
      <button
        onClick={handleSync}
        disabled={isSyncing}
        className="rounded bg-[var(--accent-primary)] px-3 py-1.5 text-[11px] font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSyncing ? "Syncing..." : "Sync API Now"}
      </button>
    </div>
  );
};
