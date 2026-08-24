import { describe, expect, it } from "vitest";
import { parsePrice } from "@/utils/canon/price";

describe("parsePrice", () => {
  it("parses a dollar amount", () => {
    expect(parsePrice("$49.99")).toBe(49.99);
    expect(parsePrice("$19.99")).toBe(19.99);
  });

  it("treats 'Included' as free", () => {
    expect(parsePrice("Included")).toBe(0);
  });

  it("returns null for an em dash", () => {
    expect(parsePrice("—")).toBeNull();
  });

  it("returns null for an arbitrary non-price string", () => {
    expect(parsePrice("Delisted")).toBeNull();
  });
});
