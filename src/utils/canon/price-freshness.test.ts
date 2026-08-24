import { describe, expect, it } from "vitest";
import { PRICE_TTL_MS, shouldAutoRefresh } from "@/utils/canon/price-freshness";

const NOW = 1_800_000_000_000;

describe("shouldAutoRefresh", () => {
  it("refreshes when nothing has ever been fetched", () => {
    expect(shouldAutoRefresh(null, NOW)).toBe(true);
  });

  it("skips a cache younger than the TTL", () => {
    expect(shouldAutoRefresh(NOW - 60_000, NOW)).toBe(false);
  });

  it("refreshes once the cache reaches the TTL", () => {
    expect(shouldAutoRefresh(NOW - PRICE_TTL_MS, NOW)).toBe(true);
    expect(shouldAutoRefresh(NOW - PRICE_TTL_MS - 1, NOW)).toBe(true);
  });

  it("treats a future timestamp as stale rather than caching forever", () => {
    expect(shouldAutoRefresh(NOW + 10 * PRICE_TTL_MS, NOW)).toBe(true);
  });

  it("honours an explicit ttl override", () => {
    expect(shouldAutoRefresh(NOW - 5_000, NOW, 1_000)).toBe(true);
    expect(shouldAutoRefresh(NOW - 500, NOW, 1_000)).toBe(false);
  });
});
