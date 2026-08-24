import { ENTRIES_STORAGE_KEY } from "@/constants/canon/storage";
import type { UserEntries, UserEntry, UserField } from "@/types/canon/user";
import { isValidOption } from "@/utils/canon/entry-options";

const FIELDS: readonly UserField[] = ["status", "device", "storefront"];
const EMPTY: UserEntries = {};

const listeners = new Set<() => void>();
let cache: UserEntries | null = null;

function sanitise(value: unknown): UserEntry | null {
  if (value === null || typeof value !== "object") return null;
  const source = value as Record<string, unknown>;
  const entry: UserEntry = {};
  for (const field of FIELDS) {
    const raw = source[field];
    if (isValidOption(field, raw)) Object.assign(entry, { [field]: raw });
  }
  return entry.status === undefined ? null : entry;
}

function read(): UserEntries {
  try {
    const raw = localStorage.getItem(ENTRIES_STORAGE_KEY);
    if (raw === null) return EMPTY;
    const parsed: unknown = JSON.parse(raw);
    if (parsed === null || typeof parsed !== "object") return EMPTY;
    const entries: UserEntries = {};
    for (const [id, value] of Object.entries(parsed)) {
      const entry = sanitise(value);
      if (entry !== null) entries[id] = entry;
    }
    return entries;
  } catch (error) {
    console.warn("entries read failed", error);
    return EMPTY;
  }
}

function write(entries: UserEntries): void {
  try {
    localStorage.setItem(ENTRIES_STORAGE_KEY, JSON.stringify(entries));
  } catch (error) {
    console.warn("entries write failed", error);
  }
}

function emit(): void {
  for (const listener of listeners) listener();
}

function onStorage(event: StorageEvent): void {
  if (event.key !== ENTRIES_STORAGE_KEY) return;
  cache = null;
  emit();
}

export function subscribeEntries(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

export function getEntriesSnapshot(): UserEntries {
  cache ??= read();
  return cache;
}

export function getServerEntriesSnapshot(): UserEntries {
  return EMPTY;
}

export function setEntryField(gameId: string, field: UserField, value: string): void {
  const next = { ...getEntriesSnapshot() };
  const entry: UserEntry = { ...next[gameId] };

  if (value === "") delete entry[field];
  else if (isValidOption(field, value)) Object.assign(entry, { [field]: value });

  if (entry.status === undefined) delete next[gameId];
  else next[gameId] = entry;

  cache = next;
  write(next);
  emit();
}

export function clearAllEntries(): void {
  cache = EMPTY;
  write(EMPTY);
  emit();
}
