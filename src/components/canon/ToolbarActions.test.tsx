import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ToolbarActions from "@/components/canon/ToolbarActions";

interface Overrides {
  tracked?: number;
  filtersActive?: boolean;
  onClearEntries?: () => void;
}

function renderToolbar({
  tracked = 0,
  filtersActive = false,
  onClearEntries = vi.fn(),
}: Overrides = {}) {
  return render(
    <ToolbarActions
      filtersActive={filtersActive}
      onClearEntries={onClearEntries}
      onCopyCsv={vi.fn(() => Promise.resolve(true))}
      onRefreshPrices={vi.fn()}
      onResetFilters={vi.fn()}
      priceMessage=""
      priceStatus="idle"
      shown={5}
      total={10}
      tracked={tracked}
    />,
  );
}

function button(name: string): HTMLElement {
  return screen.getByRole("button", { name });
}

describe("ToolbarActions", () => {
  it("disables Reset filters when no filters are active", () => {
    renderToolbar({ filtersActive: false });
    expect(button("Reset filters").hasAttribute("disabled")).toBe(true);
  });

  it("enables Reset filters when filters are active", () => {
    renderToolbar({ filtersActive: true });
    expect(button("Reset filters").hasAttribute("disabled")).toBe(false);
  });

  it("disables Clear tracking when nothing is tracked", () => {
    renderToolbar({ tracked: 0 });
    expect(button("Clear tracking").hasAttribute("disabled")).toBe(true);
  });

  it("enables Clear tracking once something is tracked", () => {
    renderToolbar({ tracked: 3 });
    expect(button("Clear tracking").hasAttribute("disabled")).toBe(false);
  });

  it("shows the shown/total split and the tracked count", () => {
    renderToolbar({ tracked: 3 });
    expect(screen.getByText("5/10 rows · 3 tracked")).toBeTruthy();
  });

  it("arms rather than wiping on the first Clear tracking click", async () => {
    const user = userEvent.setup();
    const onClearEntries = vi.fn();
    renderToolbar({ tracked: 3, onClearEntries });

    await user.click(button("Clear tracking"));

    expect(onClearEntries).not.toHaveBeenCalled();
    expect(button("Confirm wipe")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Clear tracking" })).toBeNull();
  });

  it("wipes on the confirming second click", async () => {
    const user = userEvent.setup();
    const onClearEntries = vi.fn();
    renderToolbar({ tracked: 3, onClearEntries });

    await user.click(button("Clear tracking"));
    await user.click(button("Confirm wipe"));

    expect(onClearEntries).toHaveBeenCalledTimes(1);
    expect(button("Clear tracking")).toBeTruthy();
  });
});
