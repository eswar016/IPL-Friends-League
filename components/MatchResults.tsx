import { PLAYER_NAME_BY_ID } from "@/lib/constants";
import type { MatchResultRow } from "@/types/league";

interface MatchResultsProps {
  matches: MatchResultRow[];
}

const formatStart = (isoDate: string | null): string | null => {
  if (!isoDate) {
    return null;
  }

  return new Date(isoDate).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  });
};

export const MatchResults = ({ matches }: MatchResultsProps) => (
  <section className="surface-card p-4 sm:p-6">
    <h2 className="section-heading mb-4">Match Results And Fixtures</h2>
    <div className="grid gap-3">
      {matches.map((match) => {
        const startLabel = formatStart(match.startDate);

        return (
          <article key={match.id} className="lift-on-hover rounded-xl border border-[rgba(135,160,210,0.22)] bg-[rgba(12,20,39,0.9)] p-4">
            <p className="text-base font-semibold text-[var(--text-primary)]">
              {match.team1} <span className="text-[var(--text-muted)]">vs</span> {match.team2}
            </p>
            {match.matchDesc ? <p className="mt-1 text-xs tracking-wide text-[var(--text-muted)]">{match.matchDesc}</p> : null}
            {startLabel ? <p className="mt-1 text-xs tracking-wide text-[var(--text-muted)]">Start: {startLabel}</p> : null}
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              Owners: {PLAYER_NAME_BY_ID[match.owner1]} vs {PLAYER_NAME_BY_ID[match.owner2]}
            </p>
            <p className="mt-2 text-xs uppercase tracking-[0.1em] text-[var(--text-muted)]">
              Status: {match.state.replace("_", " ")}
            </p>

            {match.ignored ? (
              <>
                <span className="mt-3 inline-flex rounded-full border border-[rgba(255,150,100,0.45)] bg-[rgba(255,111,60,0.14)] px-2.5 py-1 text-xs font-semibold tracking-wide text-[#ffb489]">
                  Ignored for leaderboard (same player teams)
                </span>
                <p className="mt-2 text-xs font-semibold text-[var(--accent-gold)]">
                  Official winner: {match.winner ?? (match.state === "complete" ? "Result unavailable" : "TBD")}
                </p>
              </>
            ) : (
              <p className="mt-3 text-sm font-semibold text-[var(--accent-gold)]">
                Winner: {match.winner ?? (match.state === "complete" ? "Result unavailable" : "TBD")}
              </p>
            )}

            {match.statusText ? <p className="mt-2 text-xs text-[var(--text-muted)]">{match.statusText}</p> : null}
          </article>
        );
      })}
    </div>
  </section>
);
