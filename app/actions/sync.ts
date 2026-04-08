"use server";

import { runSchedulerSync } from "@/lib/sync-engine";
import { loadSyncState, saveSyncState } from "@/lib/sync-store";

export async function forceSyncAction(forceSchedule = false) {
  console.log("Using RAPIDAPI_KEY starting with:", process.env.RAPIDAPI_KEY?.substring(0, 5));
  try {
    const summary = await runSchedulerSync({ 
      forceScheduleFetch: forceSchedule,
      forceResultFetch: !forceSchedule
    });
    return { success: summary.ok, error: summary.error };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown sync failure";
    return { success: false, error: message };
  }
}

export async function toggleAutoSyncAction() {
  try {
    const state = await loadSyncState();
    state.global.autoSyncEnabled = !state.global.autoSyncEnabled;
    await saveSyncState(state);
    return { success: true, enabled: state.global.autoSyncEnabled };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to toggle Auto-Sync";
    return { success: false, error: message };
  }
}
