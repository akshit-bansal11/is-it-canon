import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import FranchiseTabs from "@/components/canon/FranchiseTabs";
import type { Franchise } from "@/types/canon/canon";

const FRANCHISES: readonly Franchise[] = [
  { id: "zelda", name: "Zelda", scope: "main line", caveat: "", games: [] },
  { id: "metroid", name: "Metroid", scope: "main line", caveat: "", games: [] },
];

const COUNTS: Record<string, number> = { zelda: 4, metroid: 2 };

function renderTabs(activeId: string, onSelect: (franchiseId: string) => void) {
  return render(
    <FranchiseTabs
      activeId={activeId}
      countFor={(franchiseId) => COUNTS[franchiseId] ?? 0}
      franchises={FRANCHISES}
      onSelect={onSelect}
      totalCount={6}
    />,
  );
}

describe("FranchiseTabs", () => {
  it("renders an All tab plus one per franchise, each with its count", () => {
    renderTabs("", vi.fn());
    const tabs = screen.getAllByRole("button");

    expect(tabs).toHaveLength(FRANCHISES.length + 1);
    expect(tabs.map((tab) => tab.textContent)).toEqual(["All6", "Zelda4", "Metroid2"]);
  });

  it("exposes the tab strip as a labelled navigation landmark", () => {
    renderTabs("", vi.fn());
    expect(screen.getByRole("navigation", { name: "Franchises" })).toBeTruthy();
  });

  it("marks only the All tab as pressed when no franchise is active", () => {
    renderTabs("", vi.fn());
    const pressed = screen
      .getAllByRole("button")
      .filter((tab) => tab.getAttribute("aria-pressed") === "true");

    expect(pressed).toHaveLength(1);
    expect(pressed[0]?.textContent).toBe("All6");
  });

  it("moves aria-pressed to the active franchise", () => {
    renderTabs("metroid", vi.fn());
    const pressed = screen
      .getAllByRole("button")
      .filter((tab) => tab.getAttribute("aria-pressed") === "true");

    expect(pressed).toHaveLength(1);
    expect(pressed[0]?.textContent).toBe("Metroid2");
  });

  it("calls onSelect with the franchise id", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderTabs("", onSelect);

    await user.click(screen.getByRole("button", { name: "Zelda 4" }));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith("zelda");
  });

  it("calls onSelect with an empty id for the All tab", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderTabs("zelda", onSelect);

    await user.click(screen.getByRole("button", { name: "All 6" }));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith("");
  });
});
