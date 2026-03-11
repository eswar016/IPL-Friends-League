import { getLeagueDashboardData } from "@/lib/dashboard";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getLeagueDashboardData();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to load dashboard data" }, { status: 500 });
  }
}
