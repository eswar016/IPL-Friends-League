import { loadSyncState } from "@/lib/sync-store";
import { runSchedulerSync } from "@/lib/sync-engine";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const state = await loadSyncState();

    if (!state.global.autoSyncEnabled) {
      return NextResponse.json({ ok: true, skipped: true, reason: "Auto sync disabled in UI" });
    }

    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      hour12: false,
      hour: "numeric",
      minute: "numeric",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    
    const parts = formatter.formatToParts(now);
    const getPart = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
    
    const hour = parseInt(getPart("hour"), 10);
    const dateStr = `${getPart("year")}-${getPart("month")}-${getPart("day")}`;

    let allowSync = false;
    let reason = "Outside target windows.";

    // Window 1: 11:00 PM to 11:59 PM (Standard match ending window)
    if (hour === 23) {
      allowSync = true;
      reason = "Standard Evening Match Completion Window";
    }

    // Window 2: 7:00 PM to 7:59 PM (Double Header afternoon match ending window)
    if (hour === 19) {
      const matchesToday = Object.values(state.matches).filter((m) => {
        if (!m.startDate) return false;
        const mParts = formatter.formatToParts(new Date(m.startDate));
        const mDateStr = `${mParts.find(p=>p.type==="year")?.value}-${mParts.find(p=>p.type==="month")?.value}-${mParts.find(p=>p.type==="day")?.value}`;
        return mDateStr === dateStr;
      });

      if (matchesToday.length >= 2) {
        allowSync = true;
        reason = "Double Header Afternoon Match Completion Window";
      }
    }

    if (!allowSync) {
      return NextResponse.json({ ok: true, skipped: true, reason });
    }

    const summary = await runSchedulerSync({ forceResultFetch: true });
    return NextResponse.json({ ok: true, summary, reason });

  } catch (error) {
    console.error("Internal cron error:", error);
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
