import { formatScore } from "@/lib/league";
import type { StandingRow } from "@/types/league";

interface LeaderboardProps {
  rows: StandingRow[];
}

export const Leaderboard = ({ rows }: LeaderboardProps) => (
  <section className="surface-card p-4 sm:p-6">
    <div className="mb-4 flex items-end justify-between gap-2">
      <h2 className="section-heading">Player Leaderboard</h2>
      <span className="text-xs font-semibold tracking-[0.2em] text-[var(--text-muted)]">AUTO SYNC</span>
    </div>

    <div className="overflow-x-auto">
      <table className="min-w-full border-separate border-spacing-y-2 text-left text-sm">
        <thead>
          <tr className="text-xs uppercase tracking-[0.15em] text-[var(--text-muted)]">
            <th className="px-3 py-2">Rank</th>
            <th className="px-3 py-2">Player</th>
            <th className="px-3 py-2">Teams</th>
            <th className="px-3 py-2">Wins</th>
            <th className="px-3 py-2">Matches</th>
            <th className="px-3 py-2">Score</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.playerId} className="rounded-xl bg-[rgba(10,18,36,0.88)] transition-transform duration-200 hover:-translate-y-[2px]">
              <td className="px-3 py-3">
                <span
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold"
                  style={{
                    backgroundColor: `${row.accentColor}26`,
                    border: `1px solid ${row.accentColor}`,
                    color: row.accentColor,
                  }}
                >
                  {row.rank}
                </span>
              </td>
              <td className="px-3 py-3 font-semibold text-[var(--text-primary)]">{row.playerName}</td>
              <td className="px-3 py-3">
                <div className="flex flex-wrap gap-1.5">
                  {row.teams.map((team) => {
                    const isActive = row.activeTeams ? row.activeTeams.includes(team) : true;
                    return (
                      <span key={`${row.playerId}-${team}`} className={`team-pill ${isActive ? "" : "opacity-40 grayscale"}`}>
                        {team}
                      </span>
                    );
                  })}
                </div>
              </td>
              <td className="px-3 py-3 font-semibold text-[var(--text-primary)]">{row.wins}</td>
              <td className="px-3 py-3 font-semibold text-[var(--text-primary)]">{row.matches}</td>
              <td className="px-3 py-3 font-bold text-[var(--accent-gold)]">{formatScore(row.score)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
);
