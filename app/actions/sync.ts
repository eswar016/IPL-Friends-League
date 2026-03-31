"use server";

import { runSchedulerSync } from "@/lib/sync-engine";

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
