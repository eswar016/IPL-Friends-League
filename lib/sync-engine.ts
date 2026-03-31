import { COMPLETED_MATCHES, IPL_POINTS_TABLE, PLAYERS, TEAM_OWNERS } from "@/lib/constants";
import { addMinutes, fromIstParts, getIstDateKey, getIstParts } from "@/lib/ist-time";
import { evaluateMatches, computeStandings } from "@/lib/league";
import { fetchLiveLeaguePayload, fetchRapidScheduleFixtures, getLiveRevalidateSeconds } from "@/lib/live-data";
import {
  getSyncStoreMode,
  loadSyncState,
  saveSyncState,
  type PersistedMatchState,
  type PersistedSyncState,
} from "@/lib/sync-store";
import type { LeagueDashboardData, LeagueMatch } from "@/types/league";
import { getNextUtcQuarterHourAfter } from "@/lib/next-utc-quarter-hour";
import { createHash } from "node:crypto";

const PLAYOFF_KEYWORDS = ["qualifier", "eliminator", "final"];
const isDummyFallbackEnabled = (): boolean =>
  (process.env.IPL_ENABLE_DUMMY_FALLBACK ?? "false").trim().toLowerCase() === "true";

/** Redis JSON may be hand-edited or migrated oddly — never let bad types crash the dashboard. */
const coerceMetaString = (value: unknown): string | null => {
  if (value == null) {
    return null;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return new Date(value).toISOString();
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }
  return null;
};

const coerceMetaError = (value: unknown): string | null => {
  if (value == null) {
    return null;
  }
  if (typeof value === "string") {
    return value;
  }
  return String(value);
};

export interface SyncRunSummary {
  ok: boolean;
  mode: "redis" | "memory";
  syncedAt: string;
  scheduleFetched: boolean;
  dueMatchCount: number;
  newlyFinalizedCount: number;
  pointsFetched: boolean;
  scheduleComplete: boolean;
  fixtureCount: number;
  stableNights: number;
  nextSyncAt: string | null;
  nextSyncReason: string | null;
  error?: string;
}

export interface SyncRunOptions {
  forceScheduleFetch?: boolean;
  forceResultFetch?: boolean;
}

const pairKey = (team1: string, team2: string): string => [team1, team2].sort().join("|");

const getMatchStateKey = (match: LeagueMatch): string =>
  match.sourceMatchId ? `rapid:${match.sourceMatchId}` : match.id;

const toLeagueMatch = (state: PersistedMatchState): LeagueMatch => ({
  id: state.id,
  sourceMatchId: state.sourceMatchId,
  team1: state.team1,
  team2: state.team2,
  winner: state.winner,
  state: state.state,
  statusText: state.statusText,
  startDate: state.startDate,
  matchDesc: state.matchDesc,
});

const sortedLeagueMatches = (matches: LeagueMatch[]): LeagueMatch[] =>
  [...matches].sort((left, right) => {
    const leftTime = left.startDate ? Date.parse(left.startDate) : Number.MAX_SAFE_INTEGER;
    const rightTime = right.startDate ? Date.parse(right.startDate) : Number.MAX_SAFE_INTEGER;
    return leftTime - rightTime;
  });

const buildScheduleHash = (fixtures: LeagueMatch[]): string => {
  const signature = sortedLeagueMatches(fixtures)
    .map((match) =>
      [
        match.sourceMatchId ?? match.id,
        match.team1,
        match.team2,
        match.startDate ?? "",
        match.matchDesc ?? "",
      ].join("|"),
    )
    .join(";");

  return createHash("sha256").update(signature).digest("hex");
};

const hasPlayoffFixtures = (fixtures: LeagueMatch[]): boolean =>
  fixtures.some((match) => {
    const desc = (match.matchDesc ?? "").toLowerCase();
    return PLAYOFF_KEYWORDS.some((keyword) => desc.includes(keyword));
  });

const getBasePollTimes = (startDateIso: string): Date[] => {
  const startDate = new Date(startDateIso);
  const parts = getIstParts(startDate);

  if (parts.hour === 15 && parts.minute === 30) {
    return [
      fromIstParts(parts.year, parts.month, parts.day, 18, 45),
      fromIstParts(parts.year, parts.month, parts.day, 19, 0),
      fromIstParts(parts.year, parts.month, parts.day, 19, 15),
      fromIstParts(parts.year, parts.month, parts.day, 19, 30),
    ];
  }

  if (parts.hour === 19 && parts.minute === 30) {
    return [
      fromIstParts(parts.year, parts.month, parts.day, 22, 30),
      fromIstParts(parts.year, parts.month, parts.day, 22, 45),
      fromIstParts(parts.year, parts.month, parts.day, 23, 0),
      fromIstParts(parts.year, parts.month, parts.day, 23, 15),
      fromIstParts(parts.year, parts.month, parts.day, 23, 30),
    ];
  }

  return [addMinutes(startDate, 180), addMinutes(startDate, 195), addMinutes(startDate, 210), addMinutes(startDate, 225)];
};

const computePollTime = (startDateIso: string | null, attemptIndex: number): string | null => {
  if (!startDateIso) {
    return null;
  }

  const baseTimes = getBasePollTimes(startDateIso);
  if (baseTimes.length === 0) {
    return null;
  }

  if (attemptIndex < baseTimes.length) {
    return baseTimes[attemptIndex].toISOString();
  }

  const baseLast = baseTimes[baseTimes.length - 1];

  if (attemptIndex < baseTimes.length + 3) {
    const offset = (attemptIndex - baseTimes.length + 1) * 30;
    return addMinutes(baseLast, offset).toISOString();
  }

  const extraIndex = attemptIndex - (baseTimes.length + 3) + 1;
  return addMinutes(baseLast, 90 + extraIndex * 120).toISOString();
};

const scheduleFetchCandidate = (state: PersistedSyncState, now: Date): Date | null => {
  if (state.global.scheduleComplete) {
    return null;
  }

  const nowIst = getIstParts(now);
  const todaySevenPm = fromIstParts(nowIst.year, nowIst.month, nowIst.day, 19, 0);
  const todayKey = getIstDateKey(now);
  const fetchedToday = state.global.lastScheduleFetchDateIst === todayKey;

  if (!fetchedToday && now >= todaySevenPm) {
    return now;
  }

  if (!fetchedToday) {
    return todaySevenPm;
  }

  return addMinutes(todaySevenPm, 24 * 60);
};

const computeNextSyncTarget = (
  state: PersistedSyncState,
  now: Date,
): { nextSyncAt: string | null; nextSyncReason: string | null } => {
  const scheduleNext = scheduleFetchCandidate(state, now);
  const unresolved = Object.values(state.matches)
    .filter((match) => !match.finalized && match.nextPollAt)
    .sort((left, right) => Date.parse(left.nextPollAt ?? "") - Date.parse(right.nextPollAt ?? ""));

  let nextAt: Date | null = scheduleNext;
  let reason: string | null = scheduleNext ? "Nightly schedule fetch (7:00 PM IST)" : null;

  if (unresolved.length > 0) {
    const matchNext = new Date(unresolved[0].nextPollAt ?? "");
    if (!nextAt || matchNext < nextAt) {
      nextAt = matchNext;
      reason = `Match result poll (${unresolved[0].team1} vs ${unresolved[0].team2})`;
    }
  }

  return {
    nextSyncAt: nextAt ? nextAt.toISOString() : null,
    nextSyncReason: reason,
  };
};

const upsertScheduleFixtures = (state: PersistedSyncState, fixtures: LeagueMatch[], nowIso: string): void => {
  fixtures.forEach((fixture) => {
    const key = getMatchStateKey(fixture);
    const existing = state.matches[key];

    if (existing) {
      existing.team1 = fixture.team1;
      existing.team2 = fixture.team2;
      existing.startDate = fixture.startDate;
      existing.matchDesc = fixture.matchDesc;
      existing.sourceMatchId = fixture.sourceMatchId;
      if (!existing.finalized && !existing.nextPollAt) {
        existing.nextPollAt = computePollTime(fixture.startDate, existing.pollAttemptCount);
      }
      existing.updatedAt = nowIso;
      return;
    }

    state.matches[key] = {
      id: key,
      sourceMatchId: fixture.sourceMatchId,
      team1: fixture.team1,
      team2: fixture.team2,
      startDate: fixture.startDate,
      matchDesc: fixture.matchDesc,
      statusText: fixture.statusText || "Match scheduled",
      state: fixture.state,
      winner: null,
      finalized: false,
      resultKnown: false,
      pointsFetched: false,
      pollAttemptCount: 0,
      nextPollAt: computePollTime(fixture.startDate, 0),
      lastPolledAt: null,
      updatedAt: nowIso,
    };
  });
};

const assignOpenSheetResults = (
  allMatches: PersistedMatchState[],
  openSheetFixtures: LeagueMatch[],
): Map<string, LeagueMatch> => {
  const completedRows = openSheetFixtures.filter((row) => row.winner !== null);
  const rowsByPair = new Map<string, LeagueMatch[]>();
  completedRows.forEach((row) => {
    const key = pairKey(row.team1, row.team2);
    const current = rowsByPair.get(key) ?? [];
    current.push(row);
    rowsByPair.set(key, current);
  });

  const scheduledByPair = new Map<string, PersistedMatchState[]>();
  allMatches.forEach((match) => {
    const key = pairKey(match.team1, match.team2);
    const current = scheduledByPair.get(key) ?? [];
    current.push(match);
    scheduledByPair.set(key, current);
  });

  const assignment = new Map<string, LeagueMatch>();
  scheduledByPair.forEach((scheduled, key) => {
    const rows = rowsByPair.get(key) ?? [];
    const sortedScheduled = [...scheduled].sort((left, right) => {
      const leftTime = left.startDate ? Date.parse(left.startDate) : Number.MAX_SAFE_INTEGER;
      const rightTime = right.startDate ? Date.parse(right.startDate) : Number.MAX_SAFE_INTEGER;
      return leftTime - rightTime;
    });
    const sortedRows = sortedLeagueMatches(rows);

    for (let idx = 0; idx < Math.min(sortedScheduled.length, sortedRows.length); idx += 1) {
      assignment.set(sortedScheduled[idx].id, sortedRows[idx]);
    }
  });

  return assignment;
};

const shouldRunScheduleFetch = (state: PersistedSyncState, now: Date, forceScheduleFetch = false): boolean => {
  if (forceScheduleFetch) {
    return true;
  }
  const candidate = scheduleFetchCandidate(state, now);
  return candidate !== null && candidate <= now;
};

const processScheduleFetch = async (
  state: PersistedSyncState,
  now: Date,
  nowIso: string,
  revalidateSeconds: number,
  forceScheduleFetch = false,
): Promise<boolean> => {
  if (!shouldRunScheduleFetch(state, now, forceScheduleFetch)) {
    return false;
  }

  const fixtures = await fetchRapidScheduleFixtures(revalidateSeconds);
  const scheduleHash = buildScheduleHash(fixtures);
  const playoffPresent = hasPlayoffFixtures(fixtures);

  if (
    playoffPresent &&
    state.global.lastScheduleHash === scheduleHash &&
    state.global.fixtureCount === fixtures.length &&
    state.global.lastScheduleHash !== ""
  ) {
    state.global.stableNights += 1;
  } else {
    state.global.stableNights = 0;
  }

  if (playoffPresent && state.global.stableNights >= 7) {
    state.global.scheduleComplete = true;
  }

  state.global.lastScheduleHash = scheduleHash;
  state.global.fixtureCount = fixtures.length;
  state.global.lastScheduleFetchAt = nowIso;
  state.global.lastScheduleFetchDateIst = getIstDateKey(now);

  upsertScheduleFixtures(state, fixtures, nowIso);
  return true;
};

const processDueMatches = async (
  state: PersistedSyncState,
  now: Date,
  nowIso: string,
  revalidateSeconds: number,
  forceResultFetch = false
): Promise<{ dueCount: number; finalizedCount: number; pointsFetched: boolean }> => {
  const dueMatches = Object.values(state.matches)
    .filter((match) => {
      if (match.finalized) {
        return false;
      }
      if (forceResultFetch && match.startDate && Date.parse(match.startDate) <= now.getTime()) {
        return true;
      }
      return match.nextPollAt && Date.parse(match.nextPollAt) <= now.getTime();
    })
    .sort((left, right) => Date.parse(left.nextPollAt ?? "") - Date.parse(right.nextPollAt ?? ""));

  if (dueMatches.length === 0) {
    return { dueCount: 0, finalizedCount: 0, pointsFetched: false };
  }

  const livePayload = await fetchLiveLeaguePayload();
  const assignment = assignOpenSheetResults(Object.values(state.matches), livePayload.fixtures);
  const newlyFinalized: PersistedMatchState[] = [];

  dueMatches.forEach((match) => {
    const resolved = assignment.get(match.id);

    if (resolved?.winner) {
      match.winner = resolved.winner;
      match.state = "complete";
      match.statusText = resolved.statusText || `${resolved.winner} won`;
      match.finalized = true;
      match.resultKnown = true;
      match.nextPollAt = null;
      match.lastPolledAt = nowIso;
      match.updatedAt = nowIso;
      match.pointsFetched = false;
      newlyFinalized.push(match);
      return;
    }

    match.lastPolledAt = nowIso;
    match.pollAttemptCount += 1;
    match.nextPollAt = computePollTime(match.startDate, match.pollAttemptCount);
    match.updatedAt = nowIso;
  });

  let pointsFetched = false;
  if (newlyFinalized.length > 0) {
    const pointsTable = livePayload.pointsTable;
    if (pointsTable.length > 0) {
      state.pointsTable = pointsTable;
    }
    newlyFinalized.forEach((match) => {
      match.pointsFetched = true;
    });
    pointsFetched = true;
  }

  return {
    dueCount: dueMatches.length,
    finalizedCount: newlyFinalized.length,
    pointsFetched,
  };
};

const buildDashboardFromState = (state: PersistedSyncState): LeagueDashboardData => {
  const pageNow = new Date();
  const stateFixtures = sortedLeagueMatches(Object.values(state.matches).map(toLeagueMatch));
  const hasLiveSnapshot = stateFixtures.length > 0 || state.pointsTable.length > 0;
  const dummyFallbackEnabled = isDummyFallbackEnabled();
  const useDummyFallback = !hasLiveSnapshot && dummyFallbackEnabled;
  const fixtures = stateFixtures.length > 0 ? stateFixtures : useDummyFallback ? COMPLETED_MATCHES : [];
  const pointsTable = state.pointsTable.length > 0 ? state.pointsTable : useDummyFallback ? IPL_POINTS_TABLE : [];
  const source = hasLiveSnapshot ? "live_api" : useDummyFallback ? "fallback_dummy" : "no_data";
  const refreshedAt =
    coerceMetaString(state.meta.lastProviderFetchAt) ??
    coerceMetaString(state.global.lastScheduleFetchAt) ??
    null;

  return {
    source,
    refreshedAt,
    nextSyncAt: coerceMetaString(state.meta.nextSyncAt),
    nextSyncReason: coerceMetaString(state.meta.nextSyncReason),
    schedulerStatus: {
      storeMode: getSyncStoreMode(),
      scheduleComplete: Boolean(state.global.scheduleComplete),
      fixtureCount: Number.isFinite(Number(state.global.fixtureCount)) ? Number(state.global.fixtureCount) : 0,
      stableNights: Number.isFinite(Number(state.global.stableNights)) ? Number(state.global.stableNights) : 0,
      lastScheduleFetchAt: coerceMetaString(state.global.lastScheduleFetchAt),
      lastSyncAt: coerceMetaString(state.meta.lastSyncAt),
      lastProviderFetchAt: coerceMetaString(state.meta.lastProviderFetchAt),
      lastError: coerceMetaError(state.meta.lastError),
      nextGithubPingApproxAt: getNextUtcQuarterHourAfter(pageNow).toISOString(),
    },
    standings: computeStandings(PLAYERS, fixtures, TEAM_OWNERS),
    matches: evaluateMatches(fixtures, TEAM_OWNERS),
    pointsTable,
  };
};

export const runSchedulerSync = async (options: SyncRunOptions = {}): Promise<SyncRunSummary> => {
  const now = new Date();
  const nowIso = now.toISOString();
  const mode = getSyncStoreMode();
  const revalidateSeconds = getLiveRevalidateSeconds();
  const state = await loadSyncState();
  let scheduleFetched = false;
  let resultSummary: { dueCount: number; finalizedCount: number; pointsFetched: boolean } = {
    dueCount: 0,
    finalizedCount: 0,
    pointsFetched: false,
  };
  const errors: string[] = [];

  try {
    scheduleFetched = await processScheduleFetch(
      state,
      now,
      nowIso,
      revalidateSeconds,
      options.forceScheduleFetch ?? false,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown schedule sync failure";
    errors.push(`schedule: ${message}`);
  }

  try {
    resultSummary = await processDueMatches(state, now, nowIso, revalidateSeconds, options.forceResultFetch ?? false);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown result sync failure";
    errors.push(`results: ${message}`);
  }

  const nextSync = computeNextSyncTarget(state, now);
  const providerFetched = scheduleFetched || resultSummary.dueCount > 0 || resultSummary.pointsFetched;
  state.meta.lastSyncAt = nowIso;
  if (providerFetched) {
    state.meta.lastProviderFetchAt = nowIso;
  }
  state.meta.nextSyncAt = nextSync.nextSyncAt;
  state.meta.nextSyncReason = nextSync.nextSyncReason;
  state.meta.lastError = errors.length > 0 ? errors.join(" | ") : null;
  await saveSyncState(state);

  return {
    ok: errors.length === 0,
    mode,
    syncedAt: nowIso,
    scheduleFetched,
    dueMatchCount: resultSummary.dueCount,
    newlyFinalizedCount: resultSummary.finalizedCount,
    pointsFetched: resultSummary.pointsFetched,
    scheduleComplete: state.global.scheduleComplete,
    fixtureCount: state.global.fixtureCount,
    stableNights: state.global.stableNights,
    nextSyncAt: state.meta.nextSyncAt,
    nextSyncReason: state.meta.nextSyncReason,
    error: errors.length > 0 ? errors.join("; ") : undefined,
  };
};

export const getCachedDashboardData = async (): Promise<LeagueDashboardData> => {
  const state = await loadSyncState();
  if (!coerceMetaString(state.meta.nextSyncAt)) {
    const nextSync = computeNextSyncTarget(state, new Date());
    state.meta.nextSyncAt = nextSync.nextSyncAt;
    state.meta.nextSyncReason = nextSync.nextSyncReason;
    try {
      await saveSyncState(state);
    } catch {
      // Still render dashboard; next visit will retry persist. Avoids 500 when Redis is briefly down.
    }
  }
  return buildDashboardFromState(state);
};
