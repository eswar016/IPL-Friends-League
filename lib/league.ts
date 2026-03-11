import type {
  LeagueMatch,
  MatchState,
  MatchResultRow,
  PlayerId,
  PlayerProfile,
  StandingRow,
  TeamCode,
} from "@/types/league";

type TeamOwnerMap = Record<TeamCode, PlayerId>;

interface Tally {
  wins: number;
  matches: number;
}

const isMatchComplete = (state: MatchState): boolean => state === "complete";

const byStandingPriority = (left: StandingRow, right: StandingRow): number => {
  if (left.score !== right.score) {
    return right.score - left.score;
  }
  if (left.wins !== right.wins) {
    return right.wins - left.wins;
  }
  if (left.matches !== right.matches) {
    return left.matches - right.matches;
  }
  return left.playerName.localeCompare(right.playerName);
};

const makeTallyMap = (players: PlayerProfile[]): Record<PlayerId, Tally> =>
  players.reduce(
    (acc, player) => {
      acc[player.id] = { wins: 0, matches: 0 };
      return acc;
    },
    {} as Record<PlayerId, Tally>,
  );

export const evaluateMatches = (
  matches: LeagueMatch[],
  teamOwners: TeamOwnerMap,
): MatchResultRow[] =>
  matches.map((match) => {
    const owner1 = teamOwners[match.team1];
    const owner2 = teamOwners[match.team2];
    const ignored = owner1 === owner2;

    return {
      id: match.id,
      team1: match.team1,
      team2: match.team2,
      winner: match.winner,
      owner1,
      owner2,
      state: match.state,
      statusText: match.statusText,
      startDate: match.startDate,
      matchDesc: match.matchDesc,
      sourceMatchId: match.sourceMatchId,
      ignored,
      reason: ignored ? "Same player owns both teams" : undefined,
    };
  });

export const computeStandings = (
  players: PlayerProfile[],
  matches: LeagueMatch[],
  teamOwners: TeamOwnerMap,
): StandingRow[] => {
  const tallies = makeTallyMap(players);
  const reviewedMatches = evaluateMatches(matches, teamOwners);

  reviewedMatches.forEach((match) => {
    if (match.ignored || !match.winner || !isMatchComplete(match.state)) {
      return;
    }

    tallies[match.owner1].matches += 1;
    tallies[match.owner2].matches += 1;

    const winnerOwner = teamOwners[match.winner];
    if (winnerOwner === match.owner1 || winnerOwner === match.owner2) {
      tallies[winnerOwner].wins += 1;
    }
  });

  return players
    .map((player) => {
      const { wins, matches: playedMatches } = tallies[player.id];
      const score = playedMatches === 0 ? 0 : wins / playedMatches;

      return {
        rank: 0,
        playerId: player.id,
        playerName: player.name,
        teams: player.teams,
        accentColor: player.accentColor,
        wins,
        matches: playedMatches,
        score,
      };
    })
    .sort(byStandingPriority)
    .map((row, index) => ({
      ...row,
      rank: index + 1,
    }));
};

export const formatScore = (score: number): string => `${(score * 100).toFixed(1)}%`;
