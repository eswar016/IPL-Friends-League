"use client";

import { PLAYER_NAME_BY_ID } from "@/lib/constants";
import type { MatchResultRow } from "@/types/league";
import { useState } from "react";

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

const toEpoch = (isoDate: string | null): number =>
  isoDate ? Date.parse(isoDate) : Number.MAX_SAFE_INTEGER;

const MatchCard = ({ match }: { match: MatchResultRow }) => {
  const startLabel = formatStart(match.startDate);
  const winningOwner = match.winner === match.team1 ? PLAYER_NAME_BY_ID[match.owner1] : match.winner === match.team2 ? PLAYER_NAME_BY_ID[match.owner2] : null;

  return (
    <article className="lift-on-hover rounded-xl border border-[rgba(135,160,210,0.22)] bg-[rgba(12,20,39,0.9)] p-3 sm:p-4">
      <p className="text-sm font-semibold text-[var(--text-primary)] sm:text-base">
        {match.team1} <span className="text-[var(--text-muted)]">vs</span> {match.team2}
      </p>
      {match.matchDesc ? <p className="mt-1 text-xs tracking-wide text-[var(--text-muted)]">{match.matchDesc}</p> : null}
      {startLabel ? <p className="mt-1 text-xs tracking-wide text-[var(--text-muted)]">Start: {startLabel}</p> : null}
      <p className="mt-2 text-xs sm:text-sm text-[var(--text-muted)]">
        Owners: {PLAYER_NAME_BY_ID[match.owner1]} vs {PLAYER_NAME_BY_ID[match.owner2]}
      </p>
      <p className="mt-2 text-xs uppercase tracking-[0.1em] text-[var(--text-muted)]">Status: {match.state.replace("_", " ")}</p>

      {match.ignored ? (
        <>
          <span className="mt-3 inline-flex rounded-full border border-[rgba(255,150,100,0.45)] bg-[rgba(255,111,60,0.14)] px-2.5 py-1 text-[10px] font-semibold tracking-wide text-[#ffb489] sm:text-xs">
            Ignored for leaderboard (same player teams)
          </span>
          <p className="mt-2 text-xs font-semibold text-[var(--accent-gold)]">
            Official winner: {match.winner ?? (match.state === "complete" ? "Result unavailable" : "TBD")}
          </p>
        </>
      ) : (
        <div className="mt-3">
          <p className="text-xs font-semibold text-[var(--accent-gold)] sm:text-sm">
            Winner: {match.winner ?? (match.state === "complete" ? "Result unavailable" : "TBD")}
          </p>
          {winningOwner && match.state === "complete" ? (
            <p className="mt-1 text-[13px] font-bold tracking-wide text-[#ffb489] sm:text-[15px]">
              Winning Friend: {winningOwner} 🏆
            </p>
          ) : null}
        </div>
      )}

      {match.statusText ? <p className="mt-2 text-xs text-[var(--text-muted)]">{match.statusText}</p> : null}
    </article>
  );
};

export const MatchResults = ({ matches }: MatchResultsProps) => {
  const [activeTab, setActiveTab] = useState<"upcoming" | "completed">("upcoming");

  const liveMatches = matches
    .filter((match) => match.state === "in_progress")
    .sort((left, right) => toEpoch(left.startDate) - toEpoch(right.startDate));
  const completedMatches = matches
    .filter((match) => match.state === "complete")
    .sort((left, right) => toEpoch(right.startDate) - toEpoch(left.startDate));
  const upcomingMatches = matches
    .filter((match) => match.state !== "complete" && match.state !== "in_progress")
    .sort((left, right) => toEpoch(left.startDate) - toEpoch(right.startDate));

  return (
    <section className="surface-card p-4 sm:p-6 flex flex-col h-full">
      <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="section-heading m-0">Fixtures & Results</h2>
        
        <div className="flex rounded-lg border border-[rgba(135,160,210,0.3)] bg-[rgba(10,18,36,0.5)] p-1">
          <button
            type="button"
            onClick={() => setActiveTab("upcoming")}
            className={`rounded-md px-4 py-1.5 text-xs font-bold tracking-wider transition-colors duration-200 ${
              activeTab === "upcoming"
                ? "bg-[rgba(135,160,210,0.2)] text-[var(--accent-gold)]"
                : "text-[var(--text-muted)] hover:text-white"
            }`}
          >
            UPCOMING
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("completed")}
            className={`rounded-md px-4 py-1.5 text-xs font-bold tracking-wider transition-colors duration-200 ${
              activeTab === "completed"
                ? "bg-[rgba(135,160,210,0.2)] text-[var(--accent-gold)]"
                : "text-[var(--text-muted)] hover:text-white"
            }`}
          >
            COMPLETED
          </button>
        </div>
      </div>

      <div className="match-scroll-window pr-1 sm:pr-2 flex-grow">
        {liveMatches.length > 0 ? (
          <>
            <div className="mb-4 flex items-center justify-between border-b border-[#ffb489]/30 pb-2">
              <h3 className="text-sm font-bold tracking-[0.2em] text-[#ffb489]">🔴 LIVE IN PROGRESS</h3>
              <span className="text-xs font-semibold text-[#ffb489]/80">{liveMatches.length} Matches</span>
            </div>
            <div className="grid gap-3 mb-6">
              {liveMatches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          </>
        ) : null}

        {activeTab === "completed" && (
          <div className="fade-in">
            <div className="mb-4 flex items-center justify-between border-b border-[rgba(135,160,210,0.2)] pb-2">
              <h3 className="text-sm font-bold tracking-[0.2em] text-[#87a0d2]">COMPLETED MATCHES</h3>
              <span className="text-xs font-semibold text-[var(--accent-gold)]">{completedMatches.length} Played</span>
            </div>
            {completedMatches.length > 0 ? (
              <div className="grid gap-3">
                {completedMatches.map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            ) : (
              <p className="text-center text-sm text-[var(--text-muted)]">No matches completed yet.</p>
            )}
          </div>
        )}

        {activeTab === "upcoming" && (
          <div className="fade-in">
            <div className="mb-4 flex items-center justify-between border-b border-[rgba(135,160,210,0.2)] pb-2">
              <h3 className="text-sm font-bold tracking-[0.2em] text-[var(--text-muted)]">UPCOMING FIXTURES</h3>
              <span className="text-xs font-semibold text-[var(--text-muted)]">{upcomingMatches.length} Remaining</span>
            </div>
            {upcomingMatches.length > 0 ? (
              <div className="grid gap-3">
                {upcomingMatches.map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            ) : (
              <p className="text-center text-sm text-[var(--text-muted)]">No upcoming fixtures scheduled.</p>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
