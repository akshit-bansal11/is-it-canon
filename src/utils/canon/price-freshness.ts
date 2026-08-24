/** How long a cached price is treated as fresh enough to skip the open-time refresh. */
export const PRICE_TTL_MS = 30 * 60 * 1000;

/**
 * Prices refresh when the site is opened, but only if the cache has actually
 * aged. Without this, every reload fires a burst of ITAD lookups and earns a
 * 429 — which costs you the prices you already had. The manual "Update data"
 * button bypasses this entirely.
 */
export function shouldAutoRefresh(
  fetchedAt: number | null,
  now: number,
  ttlMs: number = PRICE_TTL_MS,
): boolean {
  if (fetchedAt === null) return true;
  const age = now - fetchedAt;
  // A clock change can put the stamp in the future; treat that as stale.
  return age < 0 || age >= ttlMs;
}
