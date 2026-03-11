import { getLeagueDashboardData } from "@/lib/dashboard";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getLeagueDashboardData();
    return NextResponse.json({
      source: data.source,
      refreshedAt: data.refreshedAt,
      nextSyncAt: data.nextSyncAt,
      nextSyncReason: data.nextSyncReason,
      pointsTable: data.pointsTable,
    });
  } catch {
    return NextResponse.json({ error: "Failed to load points table data" }, { status: 500 });
  }
}
