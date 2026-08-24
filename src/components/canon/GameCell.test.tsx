import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import GameCell from "@/components/canon/GameCell";
import type { Edition, Game } from "@/types/canon/canon";

function makeGame(overrides: Partial<Game> = {}): Game {
  return {
    id: "hl1",
    order: 1,
    title: "Half-Life",
    year: 1998,
    version: "PC",
    platform: "PC",
    msrp: "$9.99",
    hours: 12,
    tier: "core",
    starter: false,
    store: "pc",
    query: "half life",
    storefront: "steam",
    note: "",
    editions: [],
    ...overrides,
  };
}

const EDITIONS: Edition[] = [
  {
    name: "Base Edition",
    year: 1998,
    platforms: "PC",
    recommended: false,
    note: "original release",
  },
  {
    name: "Gold Edition",
    year: 2001,
    platforms: "PC, Mac",
    recommended: true,
    note: "includes expansions",
  },
];

describe("GameCell", () => {
  it("renders the title", () => {
    render(<GameCell game={makeGame()} />);
    expect(screen.getByText("Half-Life")).toBeTruthy();
  });

  it("hides the start marker for a non-starter game", () => {
    render(<GameCell game={makeGame()} />);
    expect(screen.queryByText("start")).toBeNull();
  });

  it("shows the start marker for a starter game", () => {
    render(<GameCell game={makeGame({ starter: true })} />);
    expect(screen.getByText("start")).toBeTruthy();
  });

  it("renders no disclosure when there are no editions", () => {
    const { container } = render(<GameCell game={makeGame()} />);
    expect(container.querySelector("details")).toBeNull();
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });

  it("renders a disclosure when the game has editions", () => {
    const { container } = render(<GameCell game={makeGame({ editions: EDITIONS })} />);
    expect(container.querySelector("details")).not.toBeNull();
  });

  it("lists every edition and marks the recommended one when expanded", async () => {
    const user = userEvent.setup();
    const { container } = render(<GameCell game={makeGame({ editions: EDITIONS })} />);

    const summary = container.querySelector("summary");
    expect(summary).not.toBeNull();
    if (summary !== null) await user.click(summary);

    expect(container.querySelector("details")?.open).toBe(true);

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(EDITIONS.length);
    expect(items[0]?.textContent).toContain("· Base Edition");
    expect(items[0]?.textContent).toContain("PC — original release");
    expect(items[1]?.textContent).toContain("✓ Gold Edition");
    expect(items[1]?.textContent).toContain("2001");
  });
});
