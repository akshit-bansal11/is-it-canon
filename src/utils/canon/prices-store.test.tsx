import { beforeEach, describe, expect, it, vi } from "vitest";
import { PRICES_STORAGE_KEY } from "@/constants/canon/storage";
import type { PriceQuote } from "@/types/canon/price";

type Store = typeof import("@/utils/canon/prices-store");

// The store keeps a module-level cache, so every test needs a fresh module.
async function freshStore(): Promise<Store> {
  vi.resetModules();
  return import("@/utils/canon/prices-store");
}

function quote(overrides: Partial<PriceQuote> = {}): PriceQuote {
  return {
    amount: 19.99,
    currency: "USD",
    shop: "Steam",
    cut: 50,
    url: "https://x.test",
    ...overrides,
  };
}

function seed(prices: Record<string, unknown>, fetchedAt: unknown = 1_700_000_000_000): void {
  localStorage.setItem(PRICES_STORAGE_KEY, JSON.stringify({ fetchedAt, prices }));
}

beforeEach(() => {
  localStorage.clear();
});

describe("prices-store", () => {
  it("returns an empty map when nothing is stored", async () => {
    const store = await freshStore();
    expect(store.getPricesSnapshot()).toEqual({});
    expect(store.getFetchedAt()).toBeNull();
  });

  it("round-trips a merged quote through localStorage", async () => {
    const store = await freshStore();
    store.mergePrices({ "hl-half-life": quote() });

    const reread = await freshStore();
    expect(reread.getPricesSnapshot()["hl-half-life"]?.amount).toBe(19.99);
    expect(reread.getPricesSnapshot()["hl-half-life"]?.shop).toBe("Steam");
    expect(reread.getFetchedAt()).toBeTypeOf("number");
  });

  it("merges into existing quotes rather than replacing the map", async () => {
    const store = await freshStore();
    store.mergePrices({ a: quote({ amount: 1 }) });
    store.mergePrices({ b: quote({ amount: 2 }) });

    const prices = store.getPricesSnapshot();
    expect(Object.keys(prices).sort()).toEqual(["a", "b"]);
    expect(prices.a?.amount).toBe(1);
  });

  it("drops malformed quotes instead of trusting stored JSON", async () => {
    seed({
      good: quote(),
      missingAmount: { currency: "USD", shop: "GOG", cut: 0, url: "u" },
      nanAmount: { ...quote(), amount: Number.NaN },
      wrongTypes: { ...quote(), shop: 42 },
      notAnObject: "nope",
    });

    const store = await freshStore();
    expect(Object.keys(store.getPricesSnapshot())).toEqual(["good"]);
  });

  it("survives corrupt JSON in storage", async () => {
    localStorage.setItem(PRICES_STORAGE_KEY, "{not json");
    const store = await freshStore();
    expect(store.getPricesSnapshot()).toEqual({});
  });

  it("ignores a non-numeric fetchedAt", async () => {
    seed({ good: quote() }, "yesterday");
    const store = await freshStore();
    expect(store.getFetchedAt()).toBeNull();
  });

  it("keeps the snapshot referentially stable between writes", async () => {
    const store = await freshStore();
    expect(store.getPricesSnapshot()).toBe(store.getPricesSnapshot());

    const before = store.getPricesSnapshot();
    store.mergePrices({ a: quote() });
    const after = store.getPricesSnapshot();

    expect(after).not.toBe(before);
    expect(store.getPricesSnapshot()).toBe(after);
  });

  it("notifies subscribers and stops after unsubscribe", async () => {
    const store = await freshStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribePrices(listener);

    store.mergePrices({ a: quote() });
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    store.mergePrices({ b: quote() });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("clears both the map and the timestamp", async () => {
    const store = await freshStore();
    store.mergePrices({ a: quote() });
    store.clearPrices();

    expect(store.getPricesSnapshot()).toEqual({});
    expect(store.getFetchedAt()).toBeNull();
    expect(await freshStore().then((s) => s.getPricesSnapshot())).toEqual({});
  });

  it("serves an empty map as the server snapshot", async () => {
    const store = await freshStore();
    store.mergePrices({ a: quote() });
    expect(store.getServerPricesSnapshot()).toEqual({});
  });
});
