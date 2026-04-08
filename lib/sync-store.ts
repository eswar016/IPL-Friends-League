import type { MatchState, PointsTableRow, TeamCode } from "@/types/league";
import { Redis } from "@upstash/redis";

export interface PersistedMatchState {
  id: string;
  sourceMatchId?: number;
  team1: TeamCode;
  team2: TeamCode;
  startDate: string | null;
  matchDesc?: string;
  statusText: string;
  state: MatchState;
  winner: TeamCode | null;
  finalized: boolean;
  resultKnown: boolean;
  pointsFetched: boolean;
  pollAttemptCount: number;
  nextPollAt: string | null;
  lastPolledAt: string | null;
  updatedAt: string;
}

export interface PersistedGlobalState {
  scheduleComplete: boolean;
  fixtureCount: number;
  lastScheduleHash: string;
  stableNights: number;
  lastScheduleFetchAt: string | null;
  lastScheduleFetchDateIst: string | null;
  autoSyncEnabled: boolean;
  apiCallCount: number;
}

export interface PersistedSyncMeta {
  lastSyncAt: string | null;
  /** Present after deploy; older Redis blobs may omit until first sync. */
  lastProviderFetchAt?: string | null;
  nextSyncAt: string | null;
  nextSyncReason: string | null;
  lastError: string | null;
}

export interface PersistedSyncState {
  version: 1;
  matches: Record<string, PersistedMatchState>;
  pointsTable: PointsTableRow[];
  global: PersistedGlobalState;
  meta: PersistedSyncMeta;
}

const DEFAULT_STATE: PersistedSyncState = {
  version: 1,
  matches: {},
  pointsTable: [],
  global: {
    scheduleComplete: false,
    fixtureCount: 0,
    lastScheduleHash: "",
    stableNights: 0,
    lastScheduleFetchAt: null,
    lastScheduleFetchDateIst: null,
    autoSyncEnabled: false,
    apiCallCount: 0,
  },
  meta: {
    lastSyncAt: null,
    lastProviderFetchAt: null,
    nextSyncAt: null,
    nextSyncReason: null,
    lastError: null,
  },
};

const STATE_KEY = process.env.IPL_SYNC_STATE_KEY ?? "ipl:sync:state:v1";

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

const redisClient =
  redisUrl && redisToken
    ? new Redis({
        url: redisUrl,
        token: redisToken,
      })
    : null;

let memoryState: PersistedSyncState = structuredClone(DEFAULT_STATE);

const isPersistedState = (value: unknown): value is PersistedSyncState => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<PersistedSyncState>;
  return candidate.version === 1 && typeof candidate.matches === "object" && candidate.matches !== null;
};

const cloneDefaultState = (): PersistedSyncState => structuredClone(DEFAULT_STATE);

const parseState = (raw: unknown): PersistedSyncState => {
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (isPersistedState(parsed)) {
        return parsed;
      }
    } catch {
      return cloneDefaultState();
    }
  }

  if (isPersistedState(raw)) {
    return raw;
  }

  return cloneDefaultState();
};

export const getSyncStoreMode = (): "redis" | "memory" => (redisClient ? "redis" : "memory");

export const loadSyncState = async (): Promise<PersistedSyncState> => {
  if (!redisClient) {
    return structuredClone(memoryState);
  }

  try {
    const raw = await redisClient.get<unknown>(STATE_KEY);
    return parseState(raw);
  } catch {
    // Upstash outage / network: avoid crashing SSR; empty state until Redis works again.
    return cloneDefaultState();
  }
};

export const saveSyncState = async (state: PersistedSyncState): Promise<void> => {
  if (!redisClient) {
    memoryState = structuredClone(state);
    return;
  }

  await redisClient.set(STATE_KEY, JSON.stringify(state));
};
