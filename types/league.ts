export type PlayerId = "eswar" | "anil" | "mitesh";

export type TeamCode =
  | "CSK"
  | "DC"
  | "GT"
  | "KKR"
  | "LSG"
  | "MI"
  | "PBKS"
  | "RCB"
  | "RR"
  | "SRH";

export interface PlayerProfile {
  id: PlayerId;
  name: string;
  teams: TeamCode[];
  accentColor: string;
}

export type MatchState = "upcoming" | "in_progress" | "complete" | "unknown";

export interface LeagueMatch {
  id: string;
  team1: TeamCode;
  team2: TeamCode;
  winner: TeamCode | null;
  state: MatchState;
  statusText: string;
  startDate: string | null;
  matchDesc?: string;
  sourceMatchId?: number;
}

export interface StandingRow {
  rank: number;
  playerId: PlayerId;
  playerName: string;
  teams: TeamCode[];
  activeTeams?: TeamCode[];
  accentColor: string;
  wins: number;
  matches: number;
  score: number;
}

export interface MatchResultRow {
  id: string;
  team1: TeamCode;
  team2: TeamCode;
  winner: TeamCode | null;
  owner1: PlayerId;
  owner2: PlayerId;
  state: MatchState;
  statusText: string;
  startDate: string | null;
  matchDesc?: string;
  sourceMatchId?: number;
  ignored: boolean;
  reason?: string;
}

export interface PointsTableRow {
  position: number;
  team: TeamCode;
  matches: number;
  wins: number;
  losses: number;
  points: number;
  nrr: number;
}

export type DataSource = "live_api" | "fallback_dummy" | "no_data";

export interface SchedulerStatus {
  storeMode: "redis" | "memory";
  scheduleComplete: boolean;
  fixtureCount: number;
  stableNights: number;
  lastScheduleFetchAt: string | null;
  /** Last /api/internal/sync run that wrote Redis (heartbeat). */
  lastSyncAt: string | null;
  /** Last successful RapidAPI or OpenSheet fetch (same idea as dashboard refreshedAt). */
  lastProviderFetchAt: string | null;
  /** Provider/sync error from last scheduler run (if any). */
  lastError: string | null;
  /** Approximate next GitHub Actions ping (UTC quarter hour after page render). */
  nextGithubPingApproxAt: string;
}

export interface LeagueDashboardData {
  source: DataSource;
  refreshedAt: string | null;
  nextSyncAt: string | null;
  nextSyncReason: string | null;
  schedulerStatus?: SchedulerStatus;
  standings: StandingRow[];
  matches: MatchResultRow[];
  pointsTable: PointsTableRow[];
}
