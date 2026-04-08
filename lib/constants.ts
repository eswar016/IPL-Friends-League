import type {
  LeagueMatch,
  PlayerId,
  PlayerProfile,
  PointsTableRow,
  TeamCode,
} from "@/types/league";

export const PLAYERS: PlayerProfile[] = [
  {
    id: "eswar",
    name: "Eswar",
    teams: ["RCB", "PBKS", "RR"],
    accentColor: "#ff7f50",
  },
  {
    id: "anil",
    name: "Anil",
    teams: ["CSK", "MI", "LSG", "GT"],
    accentColor: "#4fc3f7",
  },
  {
    id: "mitesh",
    name: "Mitesh",
    teams: ["SRH", "KKR", "DC"],
    accentColor: "#9ccc65",
  },
];

export const ALL_IPL_TEAMS: TeamCode[] = ["CSK", "DC", "GT", "KKR", "LSG", "MI", "PBKS", "RCB", "RR", "SRH"];

export const TEAM_OWNERS: Record<TeamCode, PlayerId> = {
  CSK: "anil",
  DC: "mitesh",
  GT: "anil",
  KKR: "mitesh",
  LSG: "anil",
  MI: "anil",
  PBKS: "eswar",
  RCB: "eswar",
  RR: "eswar",
  SRH: "mitesh",
};

export const COMPLETED_MATCHES: LeagueMatch[] = [
  { id: "m-01", team1: "KKR", team2: "RR", winner: "RR", state: "complete", statusText: "Rajasthan Royals won", startDate: null },
  {
    id: "m-02",
    team1: "RCB",
    team2: "PBKS",
    winner: "PBKS",
    state: "complete",
    statusText: "Punjab Kings won",
    startDate: null,
  },
  { id: "m-03", team1: "CSK", team2: "MI", winner: "MI", state: "complete", statusText: "Mumbai Indians won", startDate: null },
  { id: "m-04", team1: "SRH", team2: "GT", winner: "GT", state: "complete", statusText: "Gujarat Titans won", startDate: null },
  {
    id: "m-05",
    team1: "DC",
    team2: "RCB",
    winner: "RCB",
    state: "complete",
    statusText: "Royal Challengers Bengaluru won",
    startDate: null,
  },
  { id: "m-06", team1: "RR", team2: "LSG", winner: "RR", state: "complete", statusText: "Rajasthan Royals won", startDate: null },
  { id: "m-07", team1: "PBKS", team2: "KKR", winner: "KKR", state: "complete", statusText: "Kolkata Knight Riders won", startDate: null },
  { id: "m-08", team1: "MI", team2: "GT", winner: "GT", state: "complete", statusText: "Gujarat Titans won", startDate: null },
  { id: "m-09", team1: "CSK", team2: "SRH", winner: "SRH", state: "complete", statusText: "Sunrisers Hyderabad won", startDate: null },
  { id: "m-10", team1: "LSG", team2: "DC", winner: "LSG", state: "complete", statusText: "Lucknow Super Giants won", startDate: null },
  {
    id: "m-11",
    team1: "RCB",
    team2: "MI",
    winner: "RCB",
    state: "complete",
    statusText: "Royal Challengers Bengaluru won",
    startDate: null,
  },
  { id: "m-12", team1: "RR", team2: "PBKS", winner: "RR", state: "complete", statusText: "Rajasthan Royals won", startDate: null },
];

export const IPL_POINTS_TABLE: PointsTableRow[] = [
  { position: 1, team: "GT", matches: 14, wins: 10, losses: 4, nr: 0, points: 20, nrr: 0.841 },
  { position: 2, team: "RR", matches: 14, wins: 9, losses: 5, nr: 0, points: 18, nrr: 0.667 },
  { position: 3, team: "CSK", matches: 14, wins: 8, losses: 6, nr: 0, points: 16, nrr: 0.394 },
  { position: 4, team: "RCB", matches: 14, wins: 8, losses: 6, nr: 0, points: 16, nrr: 0.221 },
  { position: 5, team: "SRH", matches: 14, wins: 7, losses: 7, nr: 0, points: 14, nrr: 0.118 },
  { position: 6, team: "KKR", matches: 14, wins: 7, losses: 7, nr: 0, points: 14, nrr: -0.054 },
  { position: 7, team: "LSG", matches: 14, wins: 6, losses: 8, nr: 0, points: 12, nrr: -0.129 },
  { position: 8, team: "PBKS", matches: 14, wins: 6, losses: 8, nr: 0, points: 12, nrr: -0.227 },
  { position: 9, team: "MI", matches: 14, wins: 5, losses: 9, nr: 0, points: 10, nrr: -0.418 },
  { position: 10, team: "DC", matches: 14, wins: 4, losses: 10, nr: 0, points: 8, nrr: -0.613 },
];

export const PLAYER_NAME_BY_ID: Record<PlayerId, string> = {
  eswar: "Eswar",
  anil: "Anil",
  mitesh: "Mitesh",
};
