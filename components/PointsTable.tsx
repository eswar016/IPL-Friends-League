import { ALL_IPL_TEAMS } from "@/lib/constants";
import type { PointsTableRow } from "@/types/league";

interface PointsTableProps {
  rows: PointsTableRow[];
}

const formatNrr = (value: number): string => `${value > 0 ? "+" : ""}${value.toFixed(3)}`;

const buildZeroRows = (): PointsTableRow[] =>
  ALL_IPL_TEAMS.map((team, index) => ({
    position: index + 1,
    team,
    matches: 0,
    wins: 0,
    losses: 0,
    points: 0,
    nrr: 0,
  }));

export const PointsTable = ({ rows }: PointsTableProps) => {
  const displayRows = rows.length > 0 ? rows : buildZeroRows();

  return (
    <section className="surface-card p-4 sm:p-6">
      <h2 className="section-heading mb-4">IPL Points Table</h2>
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-[rgba(135,160,210,0.25)] text-xs uppercase tracking-[0.15em] text-[var(--text-muted)]">
            <th className="px-3 py-3">Pos</th>
            <th className="px-3 py-3">Team</th>
            <th className="px-3 py-3">M</th>
            <th className="px-3 py-3">W</th>
            <th className="px-3 py-3">L</th>
            <th className="px-3 py-3">Pts</th>
            <th className="px-3 py-3">NRR</th>
          </tr>
        </thead>
        <tbody>
          {displayRows.map((row) => (
            <tr key={row.team} className="border-b border-[rgba(135,160,210,0.15)] hover:bg-[rgba(14,25,49,0.75)]">
              <td className="px-3 py-3 font-semibold text-[var(--text-primary)]">{row.position}</td>
              <td className="px-3 py-3 font-semibold text-[var(--text-primary)]">{row.team}</td>
              <td className="px-3 py-3 text-[var(--text-muted)]">{row.matches}</td>
              <td className="px-3 py-3 text-[var(--text-muted)]">{row.wins}</td>
              <td className="px-3 py-3 text-[var(--text-muted)]">{row.losses}</td>
              <td className="px-3 py-3 font-semibold text-[var(--accent-gold)]">{row.points}</td>
              <td className="px-3 py-3 text-[var(--text-muted)]">{formatNrr(row.nrr)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </section>
  );
};
