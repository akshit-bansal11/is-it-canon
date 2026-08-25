import { describe, expect, it } from "vitest";
import type { ViewState } from "@/types/canon/view";
import { formatHash, GRID_STATE, parseHash } from "@/utils/canon/hash-view";

const table = (franchiseId: string, arcId = ""): ViewState => ({
  gridView: false,
  franchiseId,
  arcId,
});

describe("formatHash", () => {
  it("writes the grid as the bare root", () => {
    expect(formatHash(GRID_STATE)).toBe("#/");
  });

  it("names the every-game table rather than leaving it blank", () => {
    expect(formatHash(table(""))).toBe("#/all");
  });

  it("writes a franchise on its own", () => {
    expect(formatHash(table("witcher"))).toBe("#/witcher");
  });

  it("appends the storyline when one is picked", () => {
    expect(formatHash(table("ac", "desmond"))).toBe("#/ac/desmond");
  });

  it("ignores the arc while the grid is showing", () => {
    expect(formatHash({ gridView: true, franchiseId: "ac", arcId: "desmond" })).toBe("#/");
  });
});

describe("parseHash", () => {
  it("returns null for a hash it does not own", () => {
    expect(parseHash("")).toBeNull();
    expect(parseHash("#section")).toBeNull();
  });

  it("reads the grid", () => {
    expect(parseHash("#/")).toEqual(GRID_STATE);
  });

  it("reads the every-game table", () => {
    expect(parseHash("#/all")).toEqual(table(""));
  });

  it("reads a franchise and its storyline", () => {
    expect(parseHash("#/ac/desmond")).toEqual(table("ac", "desmond"));
  });

  it("survives a trailing slash", () => {
    expect(parseHash("#/witcher/")).toEqual(table("witcher"));
  });

  it("round-trips every shape it can write", () => {
    for (const view of [GRID_STATE, table(""), table("witcher"), table("ac", "desmond")]) {
      expect(parseHash(formatHash(view))).toEqual(view);
    }
  });
});
