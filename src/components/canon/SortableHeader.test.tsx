import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import SortableHeader from "@/components/canon/SortableHeader";
import type { Column, SortKey, SortState } from "@/types/canon/table";

function renderHeader(column: Column, sort: SortState, onSort: (key: SortKey) => void) {
  return render(
    <table>
      <thead>
        <tr>
          <SortableHeader column={column} onSort={onSort} sort={sort} />
        </tr>
      </thead>
    </table>,
  );
}

const TITLE_COLUMN: Column = { key: "title", label: "Title", className: "" };
const PLAIN_COLUMN: Column = { key: null, label: "Notes", className: "" };
const ASCENDING: SortState = { key: "title", direction: 1 };

describe("SortableHeader", () => {
  it("renders a non-sortable column as plain text with no button", () => {
    renderHeader(PLAIN_COLUMN, ASCENDING, vi.fn());

    expect(screen.getByRole("columnheader").textContent).toBe("Notes");
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("marks a non-sortable column as unsorted", () => {
    renderHeader(PLAIN_COLUMN, ASCENDING, vi.fn());
    expect(screen.getByRole("columnheader").getAttribute("aria-sort")).toBe("none");
  });

  it("calls onSort with the column key when the button is clicked", async () => {
    const user = userEvent.setup();
    const onSort = vi.fn();
    renderHeader(TITLE_COLUMN, { key: "year", direction: 1 }, onSort);

    await user.click(screen.getByRole("button", { name: "Title" }));

    expect(onSort).toHaveBeenCalledTimes(1);
    expect(onSort).toHaveBeenCalledWith("title");
  });

  it("reports ascending when the column is the active ascending sort", () => {
    renderHeader(TITLE_COLUMN, ASCENDING, vi.fn());
    expect(screen.getByRole("columnheader").getAttribute("aria-sort")).toBe("ascending");
  });

  it("reports descending when the column is the active descending sort", () => {
    renderHeader(TITLE_COLUMN, { key: "title", direction: -1 }, vi.fn());
    expect(screen.getByRole("columnheader").getAttribute("aria-sort")).toBe("descending");
  });

  it("reports none when another column holds the sort", () => {
    renderHeader(TITLE_COLUMN, { key: "year", direction: -1 }, vi.fn());
    expect(screen.getByRole("columnheader").getAttribute("aria-sort")).toBe("none");
  });
});
