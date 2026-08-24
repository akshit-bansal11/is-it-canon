import { beforeEach, describe, expect, it, vi } from "vitest";

const KEY = "isitcanon/entries/v1";

async function freshStore() {
  vi.resetModules();
  return import("@/utils/canon/entries-store");
}

function stored(): unknown {
  const raw = localStorage.getItem(KEY);
  return raw === null ? null : JSON.parse(raw);
}

beforeEach(() => {
  localStorage.clear();
});

describe("entries-store", () => {
  it("persists a status to localStorage", async () => {
    const { setEntryField, getEntriesSnapshot } = await freshStore();

    setEntryField("hl1", "status", "playing");

    expect(stored()).toEqual({ hl1: { status: "playing" } });
    expect(getEntriesSnapshot()).toEqual({ hl1: { status: "playing" } });
  });

  it("merges device and storefront into the same entry", async () => {
    const { setEntryField } = await freshStore();

    setEntryField("hl1", "status", "playing");
    setEntryField("hl1", "device", "steam-deck");
    setEntryField("hl1", "storefront", "steam");

    expect(stored()).toEqual({
      hl1: { status: "playing", device: "steam-deck", storefront: "steam" },
    });
  });

  it("ignores an unknown option id", async () => {
    const { setEntryField } = await freshStore();

    setEntryField("hl1", "status", "playing");
    setEntryField("hl1", "device", "not-a-device");

    expect(stored()).toEqual({ hl1: { status: "playing" } });
  });

  it("deletes the whole entry when the status is cleared", async () => {
    const { setEntryField, getEntriesSnapshot } = await freshStore();

    setEntryField("hl1", "status", "playing");
    setEntryField("hl1", "device", "steam-deck");
    setEntryField("hl1", "storefront", "steam");
    setEntryField("hl1", "status", "");

    expect(stored()).toEqual({});
    expect(getEntriesSnapshot()).toEqual({});
  });

  it("keeps other games when one entry is cleared", async () => {
    const { setEntryField } = await freshStore();

    setEntryField("hl1", "status", "playing");
    setEntryField("hl2", "status", "completed");
    setEntryField("hl1", "status", "");

    expect(stored()).toEqual({ hl2: { status: "completed" } });
  });

  it("reads back a persisted map on a fresh module load", async () => {
    localStorage.setItem(KEY, JSON.stringify({ hl1: { status: "playing", device: "pc" } }));
    const { getEntriesSnapshot } = await freshStore();

    expect(getEntriesSnapshot()).toEqual({ hl1: { status: "playing", device: "pc" } });
  });

  it("drops persisted entries that have no status", async () => {
    localStorage.setItem(KEY, JSON.stringify({ hl1: { device: "pc" } }));
    const { getEntriesSnapshot } = await freshStore();

    expect(getEntriesSnapshot()).toEqual({});
  });

  it("yields an empty map instead of throwing on malformed JSON", async () => {
    localStorage.setItem(KEY, "{ not json");
    const { getEntriesSnapshot } = await freshStore();

    expect(getEntriesSnapshot()).toEqual({});
  });

  it("returns a referentially stable snapshot while nothing changes", async () => {
    const { getEntriesSnapshot, setEntryField } = await freshStore();

    expect(getEntriesSnapshot()).toBe(getEntriesSnapshot());

    setEntryField("hl1", "status", "playing");
    const after = getEntriesSnapshot();

    expect(getEntriesSnapshot()).toBe(after);
  });

  it("notifies subscribers and empties the map on clearAllEntries", async () => {
    const { clearAllEntries, getEntriesSnapshot, setEntryField, subscribeEntries } =
      await freshStore();
    const listener = vi.fn();
    const unsubscribe = subscribeEntries(listener);

    setEntryField("hl1", "status", "playing");
    clearAllEntries();

    expect(listener).toHaveBeenCalledTimes(2);
    expect(getEntriesSnapshot()).toEqual({});
    expect(stored()).toEqual({});

    unsubscribe();
  });
});
