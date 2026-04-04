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

const getCombinations = <T>(array: T[], size: number): T[][] => {
  const result: T[][] = [];
  const helper = (start: number, combo: T[]) => {
    if (combo.length === size) {
      result.push([...combo]);
      return;
    }
    for (let i = start; i < array.length; i++) {
      combo.push(array[i]);
      helper(i + 1, combo);
      combo.pop();
    }
  };
  helper(0, []);
  return result;
};

export const computeStandings = (
  players: PlayerProfile[],
  matches: LeagueMatch[],
  teamOwners: TeamOwnerMap,
): StandingRow[] => {
  const teamTallies: Record<string, Tally> = {};
  Object.keys(teamOwners).forEach((team) => {
    teamTallies[team] = { wins: 0, matches: 0 };
  });

  const reviewedMatches = evaluateMatches(matches, teamOwners);

  reviewedMatches.forEach((match) => {
    if (match.ignored || !match.winner || !isMatchComplete(match.state)) {
      return;
    }

    if (teamTallies[match.team1]) teamTallies[match.team1].matches += 1;
    if (teamTallies[match.team2]) teamTallies[match.team2].matches += 1;
    if (teamTallies[match.winner]) teamTallies[match.winner].wins += 1;
  });

  return players
    .map((player) => {
      const subsetSize = Math.min(player.teams.length, 3);
      const subsets = getCombinations(player.teams, subsetSize);

      let bestCombo: TeamCode[] = [];
      let maxScore = -1;
      let maxWins = -1;
      let maxMatches = -1;

      subsets.forEach((combo) => {
        let w = 0;
        let m = 0;
        combo.forEach((team) => {
          w += teamTallies[team]?.wins || 0;
          m += teamTallies[team]?.matches || 0;
        });
        const score = m === 0 ? 0 : w / m;
        
        if (score > maxScore || (score === maxScore && w > maxWins)) {
          maxScore = score;
          maxWins = w;
          maxMatches = m;
          bestCombo = combo;
        }
      });

      return {
        rank: 0,
        playerId: player.id,
        playerName: player.name,
        teams: player.teams,
        activeTeams: bestCombo,
        accentColor: player.accentColor,
        wins: maxWins,
        matches: maxMatches,
        score: maxScore,
      };
    })
    .sort(byStandingPriority)
    .map((row, index) => ({
      ...row,
      rank: index + 1,
    }));
};

export const formatScore = (score: number): string => `${(score * 100).toFixed(1)}%`;
