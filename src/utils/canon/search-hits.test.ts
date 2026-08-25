import { describe, expect, it } from "vitest";
import type { Franchise, Game } from "@/types/canon/canon";
import { matchesFranchise, searchHits } from "@/utils/canon/search-hits";

function makeGame(title: string): Game {
  return {
    id: title.toLowerCase().replaceAll(" ", "-"),
    order: 1,
    title,
    year: 2011,
    version: title,
    platform: "PC",
    msrp: "$9.99",
    hours: 10,
    tier: "core",
    starter: false,
    store: "pc",
    query: title,
    storefront: "Steam",
    note: "",
    editions: [],
  };
}

const MASS_EFFECT: Franchise = {
  id: "mass-effect",
  name: "Mass Effect",
  scope: "",
  caveat: "",
  games: [makeGame("Mass Effect 2")],
};

const HALO: Franchise = {
  id: "halo",
  name: "Halo",
  scope: "",
  caveat: "",
  games: [makeGame("Halo: Reach"), makeGame("Halo 3: ODST")],
};

const FRANCHISES = [MASS_EFFECT, HALO];

describe("matchesFranchise", () => {
  it("keeps everything when nothing has been typed", () => {
    expect(matchesFranchise(HALO, "")).toBe(true);
  });

  it("matches on the series name", () => {
    expect(matchesFranchise(HALO, "hal")).toBe(true);
  });

  it("matches on a game inside the series", () => {
    expect(matchesFranchise(HALO, "odst")).toBe(true);
  });

  it("rejects what matches neither", () => {
    expect(matchesFranchise(HALO, "portal")).toBe(false);
  });
});

describe("searchHits", () => {
  it("returns nothing for an empty query", () => {
    expect(searchHits("   ", FRANCHISES, 10)).toEqual([]);
  });

  it("puts the series above one of its games at the same match quality", () => {
    const hits = searchHits("mass", FRANCHISES, 10);

    expect(hits[0]?.kind).toBe("franchise");
    expect(hits[0]?.label).toBe("Mass Effect");
    expect(hits[1]?.label).toBe("Mass Effect 2");
  });

  it("ranks a prefix match above a mid-word one", () => {
    const hits = searchHits("halo", FRANCHISES, 10);

    expect(hits[0]?.label).toBe("Halo");
  });

  it("carries the owning franchise so the caller can navigate", () => {
    const hits = searchHits("odst", FRANCHISES, 10);

    expect(hits[0]?.kind).toBe("game");
    expect(hits[0]?.franchiseId).toBe("halo");
  });

  it("honours the limit", () => {
    expect(searchHits("halo", FRANCHISES, 1)).toHaveLength(1);
  });
});
