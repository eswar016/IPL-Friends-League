import { ALL_IPL_TEAMS } from "@/lib/constants";
import type { LeagueMatch, MatchState, PointsTableRow, TeamCode } from "@/types/league";

const DEFAULT_REVALIDATE_SECONDS = 300;
const DEFAULT_RAPIDAPI_HOST = "cricbuzz-cricket.p.rapidapi.com";
const DEFAULT_IPL_SERIES_ID = 9241;
const DEFAULT_FIXTURES_API_URL =
  "https://opensheet.elk.sh/1Qa6-iiWnyRZwhYdJOkTrdiFUs64ovheRdrmQ4umkMEI/FixturesAPI";
const DEFAULT_POINTS_API_URL =
  "https://opensheet.elk.sh/1Qa6-iiWnyRZwhYdJOkTrdiFUs64ovheRdrmQ4umkMEI/PointsAPI";

const TEAM_ALIASES: Record<string, TeamCode> = {
  CSK: "CSK",
  "CHENNAI SUPER KINGS": "CSK",
  DC: "DC",
  "DELHI CAPITALS": "DC",
  GT: "GT",
  "GUJARAT TITANS": "GT",
  KKR: "KKR",
  "KOLKATA KNIGHT RIDERS": "KKR",
  LSG: "LSG",
  "LUCKNOW SUPER GIANTS": "LSG",
  MI: "MI",
  "MUMBAI INDIANS": "MI",
  PBKS: "PBKS",
  "PUNJAB KINGS": "PBKS",
  "KINGS XI PUNJAB": "PBKS",
  RCB: "RCB",
  "ROYAL CHALLENGERS BENGALURU": "RCB",
  "ROYAL CHALLENGERS BANGALORE": "RCB",
  RR: "RR",
  "RAJASTHAN ROYALS": "RR",
  SRH: "SRH",
  "SUNRISERS HYDERABAD": "SRH",
};

interface LivePayload {
  fixtures: LeagueMatch[];
  pointsTable: PointsTableRow[];
}

type RowRecord = Record<string, unknown>;

interface RapidSeriesMeta {
  id?: number;
  name?: string;
  startDt?: string;
}

interface RapidSeriesListResponse {
  seriesMapProto?: Array<{
    series?: RapidSeriesMeta[];
  }>;
}

interface RapidTeamInfo {
  teamName?: string;
  teamSName?: string;
}

interface RapidMatchInfo {
  matchId?: number;
  state?: string;
  status?: string;
  matchDesc?: string;
  startDate?: string;
  team1?: RapidTeamInfo;
  team2?: RapidTeamInfo;
}

interface RapidInnings {
  runs?: number;
}

interface RapidScore {
  inngs1?: RapidInnings;
}

interface RapidMatchScore {
  team1Score?: RapidScore;
  team2Score?: RapidScore;
}

interface RapidMatch {
  matchInfo?: RapidMatchInfo;
  matchScore?: RapidMatchScore;
}

interface RapidSeriesResponse {
  matchDetails?: Array<{
    matchDetailsMap?: {
      match?: RapidMatch[];
    };
  }>;
}

interface RapidPointsTeam {
  teamName?: string;
  teamFullName?: string;
  matchesPlayed?: number;
  matchesWon?: number;
  matchesLost?: number;
  points?: number;
  nrr?: string | number;
}

interface RapidPointsResponse {
  pointsTable?: Array<{
    pointsTableInfo?: RapidPointsTeam[];
  }>;
}

type TeamStat = {
  matches: number;
  wins: number;
  losses: number;
  nr: number;
  nrr: number;
};

const canonicalize = (value: string): string =>
  value.trim().toUpperCase().replace(/[._-]/g, " ").replace(/\s+/g, " ");

const canonicalizeKey = (value: string): string =>
  value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");

const toNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number.parseFloat(value.trim());
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
};

const toStringValue = (value: unknown): string | null => {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return null;
};

const normalizeTeamCode = (...values: Array<string | undefined | null>): TeamCode | null => {
  for (const value of values) {
    if (!value) {
      continue;
    }

    const normalized = canonicalize(value);
    if (normalized && TEAM_ALIASES[normalized]) {
      return TEAM_ALIASES[normalized];
    }
  }

  return null;
};

const normalizeState = (state: string | undefined): MatchState => {
  const normalized = (state ?? "").trim().toLowerCase();
  
  if (normalized.includes("abandon") || normalized.includes("no result")) {
    return "abandoned";
  }
  if (normalized.includes("complete")) {
    return "complete";
  }
  if (normalized.includes("upcoming")) {
    return "upcoming";
  }
  if (normalized.includes("progress") || normalized.includes("live")) {
    return "in_progress";
  }
  return "unknown";
};

const parseIsoDateFromEpochMs = (epochMsRaw: string | undefined): string | null => {
  if (!epochMsRaw) {
    return null;
  }
  const epochMs = Number.parseInt(epochMsRaw, 10);
  if (!Number.isFinite(epochMs)) {
    return null;
  }
  return new Date(epochMs).toISOString();
};

const parseIsoDateFromUnknown = (value: unknown): string | null => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const candidate = value > 10_000_000_000 ? value : value * 1000;
    const date = new Date(candidate);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const numeric = Number(trimmed);
    if (Number.isFinite(numeric)) {
      return parseIsoDateFromUnknown(numeric);
    }

    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }

  return null;
};

const getFieldValue = (row: RowRecord, keys: string[]): unknown => {
  const normalizedRow: Record<string, unknown> = {};
  Object.entries(row).forEach(([key, value]) => {
    normalizedRow[canonicalizeKey(key)] = value;
  });

  for (const key of keys) {
    const found = normalizedRow[canonicalizeKey(key)];
    if (found !== undefined && found !== null && String(found).trim() !== "") {
      return found;
    }
  }

  return null;
};

const toRows = (payload: unknown): RowRecord[] => {
  if (Array.isArray(payload)) {
    return payload.filter((item): item is RowRecord => typeof item === "object" && item !== null);
  }

  if (typeof payload === "object" && payload !== null && Array.isArray((payload as { value?: unknown }).value)) {
    return ((payload as { value: unknown[] }).value).filter(
      (item): item is RowRecord => typeof item === "object" && item !== null,
    );
  }

  return [];
};

const buildPointsTableFromFixtures = (
  fixtures: LeagueMatch[],
  nrrByTeam: Partial<Record<TeamCode, number>>,
): PointsTableRow[] => {
  const stats: Record<TeamCode, TeamStat> = ALL_IPL_TEAMS.reduce(
    (acc, team) => {
      acc[team] = {
        matches: 0,
        wins: 0,
        losses: 0,
        nr: 0,
        nrr: nrrByTeam[team] ?? 0,
      };
      return acc;
    },
    {} as Record<TeamCode, TeamStat>,
  );

  fixtures.forEach((match) => {
    if ((match.state !== "complete" && match.state !== "abandoned") || !match.winner) {
      if (match.state === "abandoned") {
        stats[match.team1].matches += 1;
        stats[match.team2].matches += 1;
        stats[match.team1].nr += 1;
        stats[match.team2].nr += 1;
        // In IPL, abandoned match splits 1 point each
        stats[match.team1].wins += 0;
      }
      return;
    }

    stats[match.team1].matches += 1;
    stats[match.team2].matches += 1;

    if (match.winner === match.team1) {
      stats[match.team1].wins += 1;
      stats[match.team2].losses += 1;
      return;
    }

    if (match.winner === match.team2) {
      stats[match.team2].wins += 1;
      stats[match.team1].losses += 1;
    }
  });

  return ALL_IPL_TEAMS.map((team) => ({
    position: 0,
    team,
    matches: stats[team].matches,
    wins: stats[team].wins,
    losses: stats[team].losses,
    nr: stats[team].nr,
    points: stats[team].wins * 2 + stats[team].nr,
    nrr: stats[team].nrr,
  }))
    .sort((left, right) => {
      if (left.points !== right.points) {
        return right.points - left.points;
      }
      if (left.wins !== right.wins) {
        return right.wins - left.wins;
      }
      if (left.nrr !== right.nrr) {
        return right.nrr - left.nrr;
      }
      return left.team.localeCompare(right.team);
    })
    .map((row, index) => ({
      ...row,
      position: index + 1,
    }));
};

const fetchJson = async (url: string, revalidateSeconds: number, headers?: HeadersInit): Promise<unknown> => {
  const response = await fetch(url, {
    headers,
    next: { revalidate: revalidateSeconds },
  });

  if (!response.ok) {
    throw new Error(`Request failed (${response.status}) for ${url}`);
  }

  return response.json();
};

const parseOpenSheetFixtures = (rows: RowRecord[]): LeagueMatch[] => {
  const fixtures: LeagueMatch[] = [];

  rows.forEach((row, index) => {
    const team1 = normalizeTeamCode(
      toStringValue(getFieldValue(row, ["Team A", "Team1", "Team 1", "Home Team"])),
    );
    const team2 = normalizeTeamCode(
      toStringValue(getFieldValue(row, ["Team B", "Team2", "Team 2", "Away Team"])),
    );
    if (!team1 || !team2) {
      return;
    }

    const winnerCandidate = normalizeTeamCode(
      toStringValue(getFieldValue(row, ["Result", "Winner", "Won By", "Winning Team"])),
    );
    const matchName = toStringValue(getFieldValue(row, ["Match", "Match Name", "Fixture"])) ?? `${team1} vs ${team2}`;
    const statusTextRaw = toStringValue(getFieldValue(row, ["Status", "Result Text"]));
    const state: MatchState = winnerCandidate ? "complete" : "upcoming";
    const statusText = statusTextRaw ?? (winnerCandidate ? `${winnerCandidate} won` : "Match pending");
    const startDate = parseIsoDateFromUnknown(getFieldValue(row, ["Date", "Start Date", "StartDate", "Start"]));
    const sourceMatchId = toNumber(getFieldValue(row, ["MatchId", "Match ID", "Id", "Fixture ID"]));

    fixtures.push({
      id: `sheet-match-${sourceMatchId ?? index + 1}`,
      sourceMatchId: sourceMatchId ?? undefined,
      team1,
      team2,
      winner: winnerCandidate && (winnerCandidate === team1 || winnerCandidate === team2) ? winnerCandidate : null,
      state,
      statusText,
      startDate,
      matchDesc: matchName,
    });
  });

  return fixtures;
};

const parseOpenSheetPoints = (rows: RowRecord[]): PointsTableRow[] => {
  const parsed = rows
    .map((row, index) => {
      const team = normalizeTeamCode(toStringValue(getFieldValue(row, ["Teams", "Team"])));
      if (!team) {
        return null;
      }

      const matches = toNumber(getFieldValue(row, ["Matches", "M"])) ?? 0;
      const wins = toNumber(getFieldValue(row, ["Won", "Wins", "W"])) ?? 0;
      const losses = toNumber(getFieldValue(row, ["Lost", "Losses", "L"])) ?? 0;
      const nr = toNumber(getFieldValue(row, ["NR", "No Result", "N/R"])) ?? matches - (wins + losses);
      const points = toNumber(getFieldValue(row, ["Points", "Pts"])) ?? wins * 2 + nr;
      const nrr = toNumber(getFieldValue(row, ["NRR", "Net Run Rate"])) ?? 0;
      const position = toNumber(getFieldValue(row, ["Position", "Pos", "Rank"])) ?? index + 1;

      return {
        position,
        team,
        matches,
        wins,
        losses,
        nr,
        points,
        nrr,
      } satisfies PointsTableRow;
    })
    .filter((item): item is PointsTableRow => item !== null);

  return parsed.sort((left, right) => left.position - right.position);
};

const fetchOpenSheetPayload = async (revalidateSeconds: number): Promise<LivePayload> => {
  const fixturesUrl = process.env.IPL_FIXTURES_API_URL ?? DEFAULT_FIXTURES_API_URL;
  const pointsUrl = process.env.IPL_POINTS_API_URL ?? DEFAULT_POINTS_API_URL;

  const [fixturesRaw, pointsRaw] = await Promise.all([
    fetchJson(fixturesUrl, revalidateSeconds),
    fetchJson(pointsUrl, revalidateSeconds),
  ]);

  const fixtures = parseOpenSheetFixtures(toRows(fixturesRaw)).sort((left, right) => {
    const leftTime = left.startDate ? Date.parse(left.startDate) : Number.MAX_SAFE_INTEGER;
    const rightTime = right.startDate ? Date.parse(right.startDate) : Number.MAX_SAFE_INTEGER;
    return leftTime - rightTime;
  });

  const pointsTableFromSheet = parseOpenSheetPoints(toRows(pointsRaw));
  const pointsTable =
    pointsTableFromSheet.length > 0 ? pointsTableFromSheet : buildPointsTableFromFixtures(fixtures, {});

  return { fixtures, pointsTable };
};

const parseWinnerFromStatus = (status: string, team1: TeamCode, team2: TeamCode): TeamCode | null => {
  const normalized = canonicalize(status);
  if (!normalized) {
    return null;
  }

  const directWinnerPhrase = normalized.match(/^(.+?)\s+WON\b/);
  if (directWinnerPhrase) {
    const detected = normalizeTeamCode(directWinnerPhrase[1]);
    if (detected === team1 || detected === team2) {
      return detected;
    }
  }

  const team1Aliases = Object.entries(TEAM_ALIASES)
    .filter(([, code]) => code === team1)
    .map(([alias]) => alias);
  const team2Aliases = Object.entries(TEAM_ALIASES)
    .filter(([, code]) => code === team2)
    .map(([alias]) => alias);

  const idx1 = team1Aliases
    .map((alias) => normalized.indexOf(alias))
    .filter((idx) => idx >= 0)
    .sort((a, b) => a - b)[0];
  const idx2 = team2Aliases
    .map((alias) => normalized.indexOf(alias))
    .filter((idx) => idx >= 0)
    .sort((a, b) => a - b)[0];

  if (idx1 !== undefined && (idx2 === undefined || idx1 < idx2)) {
    return team1;
  }
  if (idx2 !== undefined && (idx1 === undefined || idx2 < idx1)) {
    return team2;
  }

  return null;
};

const parseWinnerFromScore = (
  score: RapidMatchScore | undefined,
  team1: TeamCode,
  team2: TeamCode,
): TeamCode | null => {
  const team1Runs = toNumber(score?.team1Score?.inngs1?.runs);
  const team2Runs = toNumber(score?.team2Score?.inngs1?.runs);

  if (team1Runs === null || team2Runs === null || team1Runs === team2Runs) {
    return null;
  }

  return team1Runs > team2Runs ? team1 : team2;
};

const parseRapidFixtures = (payload: RapidSeriesResponse): LeagueMatch[] => {
  const fixtures: LeagueMatch[] = [];

  payload.matchDetails?.forEach((group) => {
    group.matchDetailsMap?.match?.forEach((item, index) => {
      const matchInfo = item.matchInfo;
      if (!matchInfo) {
        return;
      }

      const team1 = normalizeTeamCode(matchInfo.team1?.teamSName, matchInfo.team1?.teamName);
      const team2 = normalizeTeamCode(matchInfo.team2?.teamSName, matchInfo.team2?.teamName);
      if (!team1 || !team2) {
        return;
      }

      const state = normalizeState(matchInfo.state);
      const statusText = (matchInfo.status ?? "").trim();
      let winner: TeamCode | null = null;

      if (state === "complete") {
        winner = parseWinnerFromStatus(statusText, team1, team2);
        if (!winner) {
          winner = parseWinnerFromScore(item.matchScore, team1, team2);
        }
      } else if (state === "abandoned") {
        winner = null;
      }

      fixtures.push({
        id: `api-match-${matchInfo.matchId ?? index + 1}`,
        sourceMatchId: matchInfo.matchId,
        team1,
        team2,
        winner,
        state,
        statusText,
        startDate: parseIsoDateFromEpochMs(matchInfo.startDate),
        matchDesc: matchInfo.matchDesc,
      });
    });
  });

  return fixtures.sort((left, right) => {
    const leftTime = left.startDate ? Date.parse(left.startDate) : Number.MAX_SAFE_INTEGER;
    const rightTime = right.startDate ? Date.parse(right.startDate) : Number.MAX_SAFE_INTEGER;
    return leftTime - rightTime;
  });
};

const parseRapidPointsTable = (payload: RapidPointsResponse): PointsTableRow[] => {
  const table: PointsTableRow[] = [];

  payload.pointsTable?.forEach((group) => {
    group.pointsTableInfo?.forEach((teamRow, index) => {
      const code = normalizeTeamCode(teamRow.teamName, teamRow.teamFullName);
      if (!code) {
        return;
      }

      const played = toNumber(teamRow.matchesPlayed) ?? 0;
      const won = toNumber(teamRow.matchesWon) ?? 0;
      const lost = toNumber(teamRow.matchesLost) ?? 0;

      table.push({
        position: index + 1,
        team: code,
        matches: played,
        wins: won,
        losses: lost,
        nr: played - (won + lost),
        points: toNumber(teamRow.points) ?? 0,
        nrr: toNumber(teamRow.nrr) ?? 0,
      });
    });
  });

  return table.sort((a, b) => a.position - b.position);
};

const parseRevalidateSeconds = (): number => {
  const raw = process.env.IPL_API_REVALIDATE_SECONDS;
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  return DEFAULT_REVALIDATE_SECONDS;
};

const parseSeriesIdFromEnv = (): number | null => {
  const raw = process.env.IPL_SERIES_ID;
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  return null;
};

const resolveSeriesId = (): number => parseSeriesIdFromEnv() ?? DEFAULT_IPL_SERIES_ID;

const getRapidApiHost = (): string => process.env.RAPIDAPI_HOST ?? DEFAULT_RAPIDAPI_HOST;

const rapidFetch = async <T>(path: string, revalidateSeconds: number): Promise<T> => {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) {
    throw new Error("RAPIDAPI_KEY is not configured");
  }

  const host = getRapidApiHost();
  const url = `https://${host}${path}`;
  return (await fetchJson(url, revalidateSeconds, {
    "x-rapidapi-host": host,
    "x-rapidapi-key": apiKey,
  })) as T;
};

const discoverIplSeriesId = async (revalidateSeconds: number): Promise<number> => {
  const envSeriesId = parseSeriesIdFromEnv();
  if (envSeriesId) {
    return envSeriesId;
  }

  const payload = await rapidFetch<RapidSeriesListResponse>("/series/v1/league", revalidateSeconds);
  const candidates: RapidSeriesMeta[] = [];

  payload.seriesMapProto?.forEach((block) => {
    block.series?.forEach((series) => {
      if (series.name?.toLowerCase().includes("indian premier league")) {
        candidates.push(series);
      }
    });
  });

  if (candidates.length === 0) {
    return DEFAULT_IPL_SERIES_ID;
  }

  const targetYear = process.env.IPL_SERIES_YEAR ?? String(new Date().getFullYear());
  const yearMatch = candidates.filter((series) => series.name?.includes(targetYear));
  const ranked = (yearMatch.length > 0 ? yearMatch : candidates).sort((left, right) => {
    const leftStart = Number.parseInt(left.startDt ?? "0", 10);
    const rightStart = Number.parseInt(right.startDt ?? "0", 10);
    return rightStart - leftStart;
  });

  return ranked[0].id ?? DEFAULT_IPL_SERIES_ID;
};

const fetchRapidApiPayload = async (revalidateSeconds: number): Promise<LivePayload> => {
  const seriesId = await discoverIplSeriesId(revalidateSeconds);
  const seriesPayload = await rapidFetch<RapidSeriesResponse>(`/series/v1/${seriesId}`, revalidateSeconds);
  const fixtures = parseRapidFixtures(seriesPayload);

  let directPointsTable: PointsTableRow[] = [];
  try {
    const pointsPayload = await rapidFetch<RapidPointsResponse>(
      `/stats/v1/series/${seriesId}/points-table`,
      revalidateSeconds,
    );
    directPointsTable = parseRapidPointsTable(pointsPayload);
  } catch (err) {
    console.error("Failed to parse RapidAPI custom points table", err);
    directPointsTable = [];
  }

  // If RapidAPI returns exactly 10 teams in its payload, trust it implicitly. 
  // Otherwise, use fallback math built from fixtures (which assumes 0 points until we get real match completes).
  const pointsTable =
    directPointsTable.length >= 10 ? directPointsTable : buildPointsTableFromFixtures(fixtures, {});

  return { fixtures, pointsTable };
};

export const getLiveRevalidateSeconds = (): number => parseRevalidateSeconds();

export const fetchOpenSheetFixtures = async (
  revalidateSeconds = parseRevalidateSeconds(),
): Promise<LeagueMatch[]> => {
  const fixturesUrl = process.env.IPL_FIXTURES_API_URL ?? DEFAULT_FIXTURES_API_URL;
  const payload = await fetchJson(fixturesUrl, revalidateSeconds);
  return parseOpenSheetFixtures(toRows(payload));
};

export const fetchOpenSheetPointsTable = async (
  revalidateSeconds = parseRevalidateSeconds(),
): Promise<PointsTableRow[]> => {
  const pointsUrl = process.env.IPL_POINTS_API_URL ?? DEFAULT_POINTS_API_URL;
  const payload = await fetchJson(pointsUrl, revalidateSeconds);
  return parseOpenSheetPoints(toRows(payload));
};

export const fetchRapidScheduleFixtures = async (
  revalidateSeconds = parseRevalidateSeconds(),
): Promise<LeagueMatch[]> => {
  const seriesId = resolveSeriesId();
  const seriesPayload = await rapidFetch<RapidSeriesResponse>(`/series/v1/${seriesId}`, revalidateSeconds);
  return parseRapidFixtures(seriesPayload);
};

const fetchProviderPayload = async (
  provider: "opensheet" | "rapidapi",
  revalidateSeconds: number,
): Promise<LivePayload> => {
  if (provider === "opensheet") {
    return fetchOpenSheetPayload(revalidateSeconds);
  }
  return fetchRapidApiPayload(revalidateSeconds);
};

export const fetchLiveLeaguePayload = async (): Promise<LivePayload> => {
  const revalidateSeconds = parseRevalidateSeconds();
  const mode = (process.env.IPL_LIVE_PROVIDER ?? "auto").trim().toLowerCase();

  if (mode === "opensheet") {
    return fetchProviderPayload("opensheet", revalidateSeconds);
  }

  if (mode === "rapidapi") {
    return fetchProviderPayload("rapidapi", revalidateSeconds);
  }

  try {
    const openSheetPayload = await fetchProviderPayload("opensheet", revalidateSeconds);
    if (openSheetPayload.fixtures.length > 0) {
      return openSheetPayload;
    }
  } catch {
    // try next provider
  }

  return fetchProviderPayload("rapidapi", revalidateSeconds);
};
