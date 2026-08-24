import { describe, expect, it } from "vitest";
import { EMPTY_FILTER, UNSET_FILTER } from "@/constants/canon/filters";
import type { Entry, Game } from "@/types/canon/canon";
import type { UserEntries } from "@/types/canon/user";
import { filterEntries } from "@/utils/canon/filter-entries";

function entry(overrides: Partial<Game>, franchiseName = "Fable"): Entry {
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
  return {
    game,
    franchise: { id: franchiseName, name: franchiseName, scope: "", caveat: "", games: [] },
  };
}

function ids(
  entries: readonly Entry[],
  overrides: Partial<typeof EMPTY_FILTER>,
  users: UserEntries = {},
) {
  return filterEntries(entries, { ...EMPTY_FILTER, ...overrides }, users).map(
    (item) => item.game.id,
  );
}

describe("filterEntries", () => {
  it("returns everything for an empty filter", () => {
    const entries = [entry({ id: "a" }), entry({ id: "b" })];
    expect(ids(entries, {})).toEqual(["a", "b"]);
  });

  it("matches the query case-insensitively across every searchable field", () => {
    const entries = [
      entry({ id: "title", title: "Nightfall" }),
      entry({ id: "version", version: "Definitive Edition" }),
      entry({ id: "platform", platform: "Switch 2" }),
      entry({ id: "note", note: "Runs badly on handhelds" }),
      entry({ id: "franchise" }, "Silent Hill"),
      entry({ id: "year", year: 1997 }),
      entry({
        id: "edition",
        editions: [
          { name: "Goty Bundle", year: 2001, platforms: "PC", recommended: true, note: "" },
        ],
      }),
    ];

    expect(ids(entries, { query: "NIGHTFALL" })).toEqual(["title"]);
    expect(ids(entries, { query: "definitive" })).toEqual(["version"]);
    expect(ids(entries, { query: "switch" })).toEqual(["platform"]);
    expect(ids(entries, { query: "handhelds" })).toEqual(["note"]);
    expect(ids(entries, { query: "silent hill" })).toEqual(["franchise"]);
    expect(ids(entries, { query: "1997" })).toEqual(["year"]);
    expect(ids(entries, { query: "goty" })).toEqual(["edition"]);
  });

  it("returns only untracked games for the unset status filter", () => {
    const entries = [entry({ id: "tracked" }), entry({ id: "untracked" })];
    expect(ids(entries, { status: UNSET_FILTER }, { tracked: { status: "playing" } })).toEqual([
      "untracked",
    ]);
  });

  it("returns only games with a concrete status", () => {
    const entries = [
      entry({ id: "playing" }),
      entry({ id: "dropped" }),
      entry({ id: "untracked" }),
    ];
    const users: UserEntries = { playing: { status: "playing" }, dropped: { status: "dropped" } };
    expect(ids(entries, { status: "playing" }, users)).toEqual(["playing"]);
  });

  it("filters by tier", () => {
    const entries = [entry({ id: "core", tier: "core" }), entry({ id: "skip", tier: "skip" })];
    expect(ids(entries, { tier: "skip" })).toEqual(["skip"]);
  });

  it("filters by user device", () => {
    const entries = [entry({ id: "deck" }), entry({ id: "ps5" })];
    const users: UserEntries = { deck: { device: "steam-deck" }, ps5: { device: "ps5" } };
    expect(ids(entries, { device: "steam-deck" }, users)).toEqual(["deck"]);
  });

  it("filters by user storefront", () => {
    const entries = [entry({ id: "steam" }), entry({ id: "gog" })];
    const users: UserEntries = { steam: { storefront: "steam" }, gog: { storefront: "gog" } };
    expect(ids(entries, { storefront: "gog" }, users)).toEqual(["gog"]);
  });

  it("filters platforms by substring match", () => {
    const entries = [
      entry({ id: "sony", platform: "PS4 / PS5" }),
      entry({ id: "pc", platform: "PC" }),
      entry({ id: "xbox", platform: "Xbox Series" }),
    ];
    expect(ids(entries, { platform: "ps" })).toEqual(["sony"]);
    expect(ids(entries, { platform: "pc" })).toEqual(["pc"]);
    expect(ids(entries, { platform: "xb" })).toEqual(["xbox"]);
  });

  it("ANDs multiple active filters", () => {
    const entries = [
      entry({ id: "hit", title: "Ashen Road", tier: "core", platform: "PS5" }),
      entry({ id: "wrong-tier", title: "Ashen Road", tier: "skip", platform: "PS5" }),
      entry({ id: "wrong-platform", title: "Ashen Road", tier: "core", platform: "PC" }),
      entry({ id: "wrong-title", title: "Other", tier: "core", platform: "PS5" }),
    ];
    const users: UserEntries = {
      hit: { status: "playing" },
      "wrong-tier": { status: "playing" },
      "wrong-platform": { status: "playing" },
      "wrong-title": { status: "playing" },
    };
    expect(
      ids(entries, { query: "ashen", tier: "core", platform: "ps", status: "playing" }, users),
    ).toEqual(["hit"]);
  });
});
