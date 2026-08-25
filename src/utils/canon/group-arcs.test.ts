import { describe, expect, it } from "vitest";
import type { Entry, Franchise, Game } from "@/types/canon/canon";
import { groupArcs } from "@/utils/canon/group-arcs";

function makeGame(id: string, order: number, arc?: string): Game {
  return {
    id,
    order,
    arc,
    title: id,
    year: 2000 + order,
    version: "PC",
    platform: "PC",
    msrp: "$9.99",
    hours: 10,
    tier: "core",
    starter: false,
    store: "pc",
    query: id,
    storefront: "Steam",
    note: "",
    editions: [],
  };
}

function makeFranchise(games: Game[], arcs?: Franchise["arcs"]): Franchise {
  return { id: "f", name: "F", scope: "", caveat: "", arcs, games };
}

function entriesOf(franchise: Franchise): Entry[] {
  return franchise.games.map((game) => ({ game, franchise }));
}

describe("groupArcs", () => {
  it("collapses to one unlabelled section when the franchise has no arcs", () => {
    const franchise = makeFranchise([makeGame("a", 1), makeGame("b", 2)]);
    const sections = groupArcs(entriesOf(franchise), franchise);

    expect(sections).toHaveLength(1);
    expect(sections[0]?.arc).toBeNull();
    expect(sections[0]?.entries).toHaveLength(2);
  });

  it("collapses when no franchise is in view at all", () => {
    const franchise = makeFranchise([makeGame("a", 1)]);
    const sections = groupArcs(entriesOf(franchise), null);

    expect(sections).toHaveLength(1);
    expect(sections[0]?.arc).toBeNull();
  });

  it("splits rows into the declared storylines, in declared order", () => {
    const franchise = makeFranchise(
      [makeGame("a", 1, "second"), makeGame("b", 2, "first"), makeGame("c", 3, "first")],
      [
        { id: "first", name: "First", blurb: "" },
        { id: "second", name: "Second", blurb: "" },
      ],
    );

    const sections = groupArcs(entriesOf(franchise), franchise);

    expect(sections.map((section) => section.arc?.id)).toEqual(["first", "second"]);
    expect(sections[0]?.entries.map((entry) => entry.game.id)).toEqual(["b", "c"]);
  });

  it("drops a storyline that has no rows left after filtering", () => {
    const franchise = makeFranchise(
      [makeGame("a", 1, "first")],
      [
        { id: "first", name: "First", blurb: "" },
        { id: "empty", name: "Empty", blurb: "" },
      ],
    );

    const sections = groupArcs(entriesOf(franchise), franchise);

    expect(sections.map((section) => section.arc?.id)).toEqual(["first"]);
  });

  it("keeps rows whose arc is missing or unknown in a trailing loose section", () => {
    const franchise = makeFranchise(
      [makeGame("a", 1, "first"), makeGame("b", 2), makeGame("c", 3, "ghost")],
      [{ id: "first", name: "First", blurb: "" }],
    );

    const sections = groupArcs(entriesOf(franchise), franchise);

    expect(sections).toHaveLength(2);
    expect(sections[1]?.arc).toBeNull();
    expect(sections[1]?.entries.map((entry) => entry.game.id)).toEqual(["b", "c"]);
  });
});
