import type { SchedulerStatus } from "@/types/league";
import { ManualSyncButton } from "@/components/ManualSyncButton";

interface SyncDiagnosticsProps {
  status: SchedulerStatus;
  nextSyncAt: string | null;
  nextSyncReason: string | null;
}

const formatIst = (isoTimestamp: string): string => {
  const d = new Date(isoTimestamp);
  if (Number.isNaN(d.getTime())) {
    return "—";
  }
  return d.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  });
};

const formatUtc = (isoTimestamp: string): string => {
  const d = new Date(isoTimestamp);
  if (Number.isNaN(d.getTime())) {
    return "—";
  }
  return `${d.toISOString().replace("T", " ").replace(/\.\d{3}Z$/, "")} UTC`;
};

const dash = (value: string | null | undefined): string => {
  if (value == null) {
    return "—";
  }
  const s = typeof value === "string" ? value.trim() : String(value).trim();
  return s ? formatIst(s) : "—";
};

export const SyncDiagnostics = ({ status, nextSyncAt, nextSyncReason }: SyncDiagnosticsProps) => (
  <details className="mt-3 max-w-xl rounded-md border border-[rgba(135,160,210,0.12)] bg-[rgba(8,14,28,0.35)] px-2.5 py-1.5 text-[10px] leading-relaxed text-[var(--text-muted)] sm:text-[11px]">
    <summary className="cursor-pointer select-none font-medium tracking-[0.12em] text-[var(--text-muted)] hover:text-[var(--text-primary)]">
      Sync diagnostics
    </summary>
    <div className="mt-2 space-y-1.5 border-t border-[rgba(135,160,210,0.1)] pt-2">
      <p className="text-[9px] uppercase tracking-wide text-[#ffb489] opacity-90 sm:text-[10px]">
        Auto-Sync & Background Polling Disabled. Manual Admin Sync Only.
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
          <span className="break-words font-mono text-[10px] sm:text-[11px]">{String(status.lastError)}</span>
        </p>
      ) : null}
      <ManualSyncButton />
    </div>
  </details>
);
