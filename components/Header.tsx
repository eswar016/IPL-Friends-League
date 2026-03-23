import { NextUpdateCountdown } from "@/components/NextUpdateCountdown";
import { SyncDiagnostics } from "@/components/SyncDiagnostics";
import type { DataSource, SchedulerStatus } from "@/types/league";

interface HeaderProps {
  source: DataSource;
  refreshedAt: string | null;
  nextSyncAt: string | null;
  nextSyncReason: string | null;
  schedulerStatus?: SchedulerStatus;
}

const CricketLogo = () => (
  <svg
    aria-hidden="true"
    className="h-12 w-12"
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="21" cy="20" r="13" fill="#ff6f3c" />
    <path d="M31.5 28L50.5 47C52.9 49.4 52.9 53.3 50.5 55.7C48.1 58.1 44.2 58.1 41.8 55.7L22.8 36.7L31.5 28Z" fill="#f4c66d" />
    <path d="M24.5 14.5C28.2 16.8 30.2 19 34.1 21.2" stroke="#fff4e0" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="18" cy="16" r="1.2" fill="#fff4e0" />
    <circle cx="23.5" cy="24.5" r="1.2" fill="#fff4e0" />
  </svg>
);

const sourceLabel: Record<DataSource, string> = {
  live_api: "LIVE API",
  fallback_dummy: "FALLBACK DUMMY DATA",
  no_data: "WAITING FOR FIRST SYNC",
};

const formatIstTimestamp = (isoTimestamp: string): string => {
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

export const Header = ({ source, refreshedAt, nextSyncAt, nextSyncReason, schedulerStatus }: HeaderProps) => (
  <header className="surface-card lift-on-hover relative overflow-hidden p-5 sm:p-7">
    <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[radial-gradient(circle,_rgba(255,111,60,0.35)_0%,_rgba(255,111,60,0)_70%)]" />
    <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex items-center gap-4">
          <CricketLogo />
          <div>
            <p className="text-xs font-semibold tracking-[0.35em] text-[var(--text-muted)] sm:text-sm">
              FRIENDS SPORTS DASHBOARD
            </p>
            <h1 className="font-heading text-3xl leading-tight font-bold text-[var(--text-primary)] sm:text-4xl">
              IPL Friends League 2026
            </h1>
          </div>
        </div>
        {schedulerStatus ? (
          <SyncDiagnostics
            status={schedulerStatus}
            nextSyncAt={nextSyncAt}
            nextSyncReason={nextSyncReason}
          />
        ) : null}
      </div>
      <div className="rounded-lg border border-[rgba(141,168,219,0.3)] bg-[rgba(12,23,47,0.75)] px-3 py-2 text-xs tracking-wide text-[var(--text-muted)]">
        <p className="font-semibold text-[var(--accent-gold)]">{sourceLabel[source]}</p>
        <p>Last API fetch: {refreshedAt ? formatIstTimestamp(refreshedAt) : "Not yet"}</p>
        <NextUpdateCountdown nextSyncAt={nextSyncAt} nextSyncReason={nextSyncReason} />
      </div>
    </div>
  </header>
);
