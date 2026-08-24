import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import OptionSelect from "@/components/canon/OptionSelect";
import type { Option } from "@/types/canon/user";

const OPTIONS: readonly Option[] = [
  { id: "playing", label: "Playing" },
  { id: "completed", label: "Completed" },
];

function renderSelect(onChange: (value: string) => void, value = "") {
  return render(
    <OptionSelect
      label="Status"
      onChange={onChange}
      options={OPTIONS}
      placeholder="Status…"
      value={value}
    />,
  );
}

describe("OptionSelect", () => {
  it("is reachable by its aria-label", () => {
    renderSelect(vi.fn());
    expect(screen.getByLabelText("Status")).toBeTruthy();
  });

  it("renders the placeholder as the empty option plus every option", () => {
    renderSelect(vi.fn());
    const options = screen.getAllByRole("option");

    expect(options).toHaveLength(OPTIONS.length + 1);
    expect(options[0]?.textContent).toBe("Status…");
    expect(options[0]?.getAttribute("value")).toBe("");
    expect(screen.getByRole("option", { name: "Playing" })).toBeTruthy();
    expect(screen.getByRole("option", { name: "Completed" })).toBeTruthy();
  });

  it("fires onChange with the selected id", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderSelect(onChange);

    await user.selectOptions(screen.getByLabelText("Status"), "completed");

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("completed");
  });

  it("reflects the current value", () => {
    renderSelect(vi.fn(), "playing");
    const select = screen.getByLabelText("Status");
    expect(select).toHaveProperty("value", "playing");
  });
});
