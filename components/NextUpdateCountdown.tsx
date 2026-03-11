"use client";

import { useEffect, useMemo, useState } from "react";

interface NextUpdateCountdownProps {
  nextSyncAt: string | null;
  nextSyncReason: string | null;
}

const formatIst = (isoTimestamp: string): string =>
  new Date(isoTimestamp).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  });

const formatCountdown = (targetIso: string, nowEpoch: number): string => {
  const target = new Date(targetIso).getTime();
  const remainingMs = Math.max(0, target - nowEpoch);
  const totalSeconds = Math.floor(remainingMs / 1000);

  const hours = Math.floor(totalSeconds / 3600)
    .toString()
    .padStart(2, "0");
  const minutes = Math.floor((totalSeconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");

  return `${hours}:${minutes}:${seconds}`;
};

export const NextUpdateCountdown = ({ nextSyncAt, nextSyncReason }: NextUpdateCountdownProps) => {
  const [nowEpoch, setNowEpoch] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNowEpoch(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const countdown = useMemo(() => {
    if (!nextSyncAt) {
      return null;
    }
    return formatCountdown(nextSyncAt, nowEpoch);
  }, [nextSyncAt, nowEpoch]);

  if (!nextSyncAt) {
    return (
      <div className="mt-2 text-xs text-[var(--text-muted)]">
        <p>Next update: waiting for scheduler run</p>
      </div>
    );
  }

  return (
    <div className="mt-2 text-xs text-[var(--text-muted)]">
      <p>Next update (IST): {formatIst(nextSyncAt)}</p>
      <p>Countdown: {countdown}</p>
      {nextSyncReason ? <p>{nextSyncReason}</p> : null}
    </div>
  );
};
