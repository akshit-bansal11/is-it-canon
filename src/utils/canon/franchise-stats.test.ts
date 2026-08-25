import { describe, expect, it } from "vitest";
import type { Franchise, Game } from "@/types/canon/canon";
import type { UserEntries } from "@/types/canon/user";
import { statsFor } from "@/utils/canon/franchise-stats";

function makeGame(id: string, hours: number | null): Game {
  return {
    id,
    order: 1,
    title: id,
    year: 2011,
    version: "PC",
    platform: "PC",
    msrp: "$9.99",
    hours,
    tier: "core",
    starter: false,
    store: "pc",
    query: id,
    storefront: "Steam",
    note: "",
    editions: [],
  };
}

const FRANCHISE: Franchise = {
  id: "f",
  name: "F",
  scope: "",
  caveat: "",
  arcs: [{ id: "one", name: "One", blurb: "" }],
  games: [makeGame("a", 10), makeGame("b", 5), makeGame("c", null)],
};

describe("statsFor", () => {
  it("reports an untouched franchise as all total, nothing tracked", () => {
    const stats = statsFor(FRANCHISE, {});

    expect(stats.total).toBe(3);
    expect(stats.tracked).toBe(0);
    expect(stats.completed).toBe(0);
  });

  it("treats an unknown length as zero rather than NaN", () => {
    expect(statsFor(FRANCHISE, {}).hours).toBe(15);
  });

  it("counts tracked and completed separately", () => {
    const userEntries: UserEntries = {
      a: { status: "completed" },
      b: { status: "backlogged" },
    };
    const stats = statsFor(FRANCHISE, userEntries);

    expect(stats.tracked).toBe(2);
    expect(stats.completed).toBe(1);
  });

  it("ignores an entry that has a device but no status", () => {
    const stats = statsFor(FRANCHISE, { a: { device: "pc" } });

    expect(stats.tracked).toBe(0);
  });

  it("counts declared storylines", () => {
    expect(statsFor(FRANCHISE, {}).arcs).toBe(1);
    expect(statsFor({ ...FRANCHISE, arcs: undefined }, {}).arcs).toBe(0);
  });
});
