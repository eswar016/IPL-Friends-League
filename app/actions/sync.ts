"use server";

import { runSchedulerSync } from "@/lib/sync-engine";

export async function forceSyncAction() {
  try {
    const summary = await runSchedulerSync({ forceScheduleFetch: true });
    return { success: summary.ok, error: summary.error };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown sync failure";
    return { success: false, error: message };
  }
}
