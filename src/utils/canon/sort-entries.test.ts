import { describe, expect, it } from "vitest";
import type { Entry, Franchise, Game } from "@/types/canon/canon";
import type { PriceMap } from "@/types/canon/price";
import type { SortDirection, SortKey } from "@/types/canon/table";
import type { UserEntries } from "@/types/canon/user";
import { type SortContext, sortEntries } from "@/utils/canon/sort-entries";

const FRANCHISE: Franchise = { id: "f", name: "Fable", scope: "", caveat: "", games: [] };

function entry(overrides: Partial<Game>): Entry {
  const game: Game = {
    id: "g",
    order: 0,
    title: "Game",
    year: 2000,
    version: "Original",
    platform: "PC",
    msrp: "$0.00",
    hours: null,
    tier: "core",
    starter: false,
    store: "pc",
    query: "",
    storefront: "",
    note: "",
    editions: [],
    ...overrides,
  };
  return { game, franchise: FRANCHISE };
}

function context(userEntries: UserEntries = {}, prices: PriceMap = {}): SortContext {
  return { userEntries, prices };
}

function ids(entries: readonly Entry[], key: SortKey, direction: SortDirection, ctx: SortContext) {
  return sortEntries(entries, { key, direction }, ctx).map((item) => item.game.id);
}

function quote(amount: number) {
  return { amount, currency: "USD", shop: "steam", cut: 0, url: "" };
}

describe("sortEntries", () => {
  it("sorts by order ascending by default", () => {
    const entries = [
      entry({ id: "c", order: 3 }),
      entry({ id: "a", order: 1 }),
      entry({ id: "b", order: 2 }),
    ];
    expect(ids(entries, "order", 1, context())).toEqual(["a", "b", "c"]);
  });

  it("reverses order when direction is -1", () => {
    const entries = [
      entry({ id: "c", order: 3 }),
      entry({ id: "a", order: 1 }),
      entry({ id: "b", order: 2 }),
    ];
    expect(ids(entries, "order", -1, context())).toEqual(["c", "b", "a"]);
  });

  it("sorts titles case-insensitively", () => {
    const entries = [
      entry({ id: "c", order: 1, title: "cherry" }),
      entry({ id: "b", order: 2, title: "Banana" }),
      entry({ id: "a", order: 3, title: "apple" }),
    ];
    expect(ids(entries, "title", 1, context())).toEqual(["a", "b", "c"]);
  });

  it("sorts by parsed msrp and keeps unparseable prices last in both directions", () => {
    const entries = [
      entry({ id: "dash", order: 1, msrp: "—" }),
      entry({ id: "high", order: 2, msrp: "$49.99" }),
      entry({ id: "low", order: 3, msrp: "$19.99" }),
    ];
    expect(ids(entries, "msrp", 1, context())).toEqual(["low", "high", "dash"]);
    expect(ids(entries, "msrp", -1, context())).toEqual(["high", "low", "dash"]);
  });

  it("sorts by live price and puts games without a quote last", () => {
    const entries = [
      entry({ id: "none", order: 1 }),
      entry({ id: "high", order: 2 }),
      entry({ id: "low", order: 3 }),
    ];
    const ctx = context({}, { high: quote(40), low: quote(10) });
    expect(ids(entries, "now", 1, ctx)).toEqual(["low", "high", "none"]);
    expect(ids(entries, "now", -1, ctx)).toEqual(["high", "low", "none"]);
  });

  it("sorts by status rank with untracked games last", () => {
    const entries = [
      entry({ id: "trash", order: 1 }),
      entry({ id: "untracked", order: 2 }),
      entry({ id: "dropped", order: 3 }),
      entry({ id: "wishlist", order: 4 }),
      entry({ id: "backlogged", order: 5 }),
      entry({ id: "completed", order: 6 }),
      entry({ id: "playing", order: 7 }),
    ];
    const ctx = context({
      trash: { status: "trash" },
      dropped: { status: "dropped" },
      wishlist: { status: "wishlist" },
      backlogged: { status: "backlogged" },
      completed: { status: "completed" },
      playing: { status: "playing" },
    });
    expect(ids(entries, "status", 1, ctx)).toEqual([
      "playing",
      "completed",
      "backlogged",
      "wishlist",
      "dropped",
      "trash",
      "untracked",
    ]);
  });

  it("breaks ties on game order", () => {
    const entries = [
      entry({ id: "second", order: 2, tier: "core" }),
      entry({ id: "first", order: 1, tier: "core" }),
      entry({ id: "third", order: 3, tier: "skip" }),
    ];
    expect(ids(entries, "tier", 1, context())).toEqual(["first", "second", "third"]);
  });

  it("does not mutate the input array", () => {
    const entries = [entry({ id: "b", order: 2 }), entry({ id: "a", order: 1 })];
    const result = sortEntries(entries, { key: "order", direction: 1 }, context());
    expect(entries.map((item) => item.game.id)).toEqual(["b", "a"]);
    expect(result[0]?.game.id).toBe("a");
  });
});
