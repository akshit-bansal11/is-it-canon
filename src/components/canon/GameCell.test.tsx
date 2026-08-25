import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
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

const BASE_EDITION: Edition = {
  name: "Base Edition",
  year: 1998,
  platforms: "PC",
  recommended: false,
  note: "original release",
};

const GOLD_EDITION: Edition = {
  name: "Gold Edition",
  year: 2001,
  platforms: "PC, Mac",
  recommended: true,
  note: "includes expansions",
};

const EDITIONS: Edition[] = [BASE_EDITION, GOLD_EDITION];

describe("GameCell", () => {
  it("renders the title", () => {
    render(<GameCell game={makeGame()} onOpen={vi.fn()} />);
    expect(screen.getByText("Half-Life")).toBeTruthy();
  });

  it("hides the start marker for a non-starter game", () => {
    render(<GameCell game={makeGame()} onOpen={vi.fn()} />);
    expect(screen.queryByText("start")).toBeNull();
  });

  it("shows the start marker for a starter game", () => {
    render(<GameCell game={makeGame({ starter: true })} onOpen={vi.fn()} />);
    expect(screen.getByText("start")).toBeTruthy();
  });

  it("stays quiet about editions when there is only one release", () => {
    render(<GameCell game={makeGame({ editions: [BASE_EDITION] })} onOpen={vi.fn()} />);
    expect(screen.queryByText(/editions/)).toBeNull();
  });

  it("counts the editions when there is a choice to make", () => {
    render(<GameCell game={makeGame({ editions: EDITIONS })} onOpen={vi.fn()} />);
    expect(screen.getByText("2 editions")).toBeTruthy();
  });

  it("opens the detail panel when the title is activated", async () => {
    const onOpen = vi.fn();
    const user = userEvent.setup();
    render(<GameCell game={makeGame()} onOpen={onOpen} />);

    await user.click(screen.getByRole("button"));

    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});
