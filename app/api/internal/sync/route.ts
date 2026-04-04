import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { ok: false, error: "Automated cron polling has been removed. Use Manual Admin Sync." },
    { status: 403 }
  );
}
