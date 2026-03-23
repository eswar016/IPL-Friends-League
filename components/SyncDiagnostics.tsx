import type { SchedulerStatus } from "@/types/league";

interface SyncDiagnosticsProps {
  status: SchedulerStatus;
  nextSyncAt: string | null;
  nextSyncReason: string | null;
}

const formatIst = (isoTimestamp: string): string =>
  new Date(isoTimestamp).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  });

const formatUtc = (isoTimestamp: string): string =>
  new Date(isoTimestamp).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
    timeZoneName: "short",
  });

const dash = (value: string | null | undefined): string =>
  value && value.trim() ? formatIst(value) : "—";

export const SyncDiagnostics = ({ status, nextSyncAt, nextSyncReason }: SyncDiagnosticsProps) => (
  <details className="mt-3 max-w-xl rounded-md border border-[rgba(135,160,210,0.12)] bg-[rgba(8,14,28,0.35)] px-2.5 py-1.5 text-[10px] leading-relaxed text-[var(--text-muted)] sm:text-[11px]">
    <summary className="cursor-pointer select-none font-medium tracking-[0.12em] text-[var(--text-muted)] hover:text-[var(--text-primary)]">
      Sync diagnostics
    </summary>
    <div className="mt-2 space-y-1.5 border-t border-[rgba(135,160,210,0.1)] pt-2">
      <p>
        <span className="text-[var(--text-muted)]">Next GitHub ping (approx):</span>{" "}
        <span className="font-mono text-[var(--text-primary)]">{formatUtc(status.nextGithubPingApproxAt)}</span>
        <span className="text-[var(--text-muted)]"> · </span>
        <span className="font-mono text-[var(--text-primary)]">{formatIst(status.nextGithubPingApproxAt)}</span>
        <span className="block text-[9px] opacity-75 sm:text-[10px]">Cron is every 15 min on UTC quarter hours; GitHub may start a few seconds later.</span>
      </p>
      <p>
        <span className="text-[var(--text-muted)]">Next provider API (IST):</span>{" "}
        <span className="font-mono text-[var(--text-primary)]">{nextSyncAt ? formatIst(nextSyncAt) : "—"}</span>
        {nextSyncReason ? (
          <span className="block text-[9px] opacity-80 sm:text-[10px]">{nextSyncReason}</span>
        ) : null}
      </p>
      <p>
        <span className="text-[var(--text-muted)]">Last scheduler heartbeat (Redis):</span>{" "}
        <span className="font-mono text-[var(--text-primary)]">{dash(status.lastSyncAt)}</span>
      </p>
      <p>
        <span className="text-[var(--text-muted)]">Last provider fetch (Redis):</span>{" "}
        <span className="font-mono text-[var(--text-primary)]">{dash(status.lastProviderFetchAt)}</span>
      </p>
      <p>
        <span className="text-[var(--text-muted)]">Last RapidAPI schedule stored:</span>{" "}
        <span className="font-mono text-[var(--text-primary)]">{dash(status.lastScheduleFetchAt)}</span>
      </p>
      <p>
        <span className="text-[var(--text-muted)]">Store:</span>{" "}
        <span className="font-mono text-[var(--accent-gold)]">{status.storeMode}</span>
        <span className="text-[var(--text-muted)]"> · schedule complete: </span>
        <span className="font-mono">{status.scheduleComplete ? "yes" : "no"}</span>
        <span className="text-[var(--text-muted)]"> · fixtures: </span>
        <span className="font-mono">{status.fixtureCount}</span>
      </p>
      {status.lastError ? (
        <p className="rounded border border-[rgba(255,111,60,0.25)] bg-[rgba(255,111,60,0.06)] px-2 py-1 text-[var(--text-primary)]">
          <span className="font-semibold text-[#ffb489]">Last error: </span>
          <span className="break-words font-mono text-[10px] sm:text-[11px]">{status.lastError}</span>
        </p>
      ) : null}
    </div>
  </details>
);
