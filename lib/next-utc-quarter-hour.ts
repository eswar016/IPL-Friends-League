/**
 * Next instant aligned to UTC quarter hours (:00, :15, :30, :45) strictly after `now`.
 * Aligns with GitHub Actions cron every 15 minutes on UTC clock boundaries.
 */
export const getNextUtcQuarterHourAfter = (now: Date = new Date()): Date => {
  const intervalMs = 15 * 60 * 1000;
  const t = now.getTime();
  const slot = Math.floor(t / intervalMs);
  return new Date((slot + 1) * intervalMs);
};
