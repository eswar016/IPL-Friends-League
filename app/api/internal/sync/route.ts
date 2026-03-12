import { runSchedulerSync } from "@/lib/sync-engine";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const readBearerToken = (authorizationHeader: string | null): string | null => {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(" ");
  if (!scheme || !token || scheme.toLowerCase() !== "bearer") {
    return null;
  }

  return token;
};

const isAuthorized = (request: NextRequest): boolean => {
  const secret = process.env.CRON_SECRET ?? process.env.SYNC_CRON_KEY;
  if (!secret) {
    return true;
  }

  const bearer = readBearerToken(request.headers.get("authorization"));
  const authHeader = request.headers.get("x-sync-key");
  const queryKey = request.nextUrl.searchParams.get("key");
  return bearer === secret || authHeader === secret || queryKey === secret;
};

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized sync trigger" }, { status: 401 });
  }

  const forceRaw = request.nextUrl.searchParams.get("force");
  const force =
    forceRaw === "1" ||
    (typeof forceRaw === "string" && forceRaw.toLowerCase() === "true") ||
    (typeof forceRaw === "string" && forceRaw.toLowerCase() === "yes");
  const summary = await runSchedulerSync({ forceScheduleFetch: force });
  const status = summary.ok ? 200 : 500;
  return NextResponse.json(summary, { status });
}

export async function POST(request: NextRequest) {
  return GET(request);
}
