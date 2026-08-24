import { PRICES_STORAGE_KEY } from "@/constants/canon/storage";
import type { PriceMap, PriceQuote } from "@/types/canon/price";

interface PricesRecord {
  fetchedAt: number | null;
  prices: PriceMap;
}

const EMPTY: PriceMap = Object.freeze({});
const EMPTY_RECORD: PricesRecord = Object.freeze({ fetchedAt: null, prices: EMPTY });

const listeners = new Set<() => void>();
let cache: PricesRecord | null = null;

function sanitise(value: unknown): PriceQuote | null {
  if (value === null || typeof value !== "object") return null;
  const { amount, currency, shop, cut, url } = value as Record<string, unknown>;
  if (typeof amount !== "number" || !Number.isFinite(amount)) return null;
  if (typeof cut !== "number") return null;
  if (typeof currency !== "string" || typeof shop !== "string" || typeof url !== "string") {
    return null;
  }
  return { amount, currency, shop, cut, url };
}

function read(): PricesRecord {
  try {
    const raw = localStorage.getItem(PRICES_STORAGE_KEY);
    if (raw === null) return EMPTY_RECORD;
    const parsed: unknown = JSON.parse(raw);
    if (parsed === null || typeof parsed !== "object") return EMPTY_RECORD;
    const { fetchedAt, prices } = parsed as Record<string, unknown>;
    if (prices === null || typeof prices !== "object") return EMPTY_RECORD;
    const next: PriceMap = {};
    for (const [id, value] of Object.entries(prices)) {
      const quote = sanitise(value);
      if (quote !== null) next[id] = quote;
    }
    const stamp = typeof fetchedAt === "number" && Number.isFinite(fetchedAt) ? fetchedAt : null;
    return { fetchedAt: stamp, prices: next };
  } catch (error) {
    console.warn("prices read failed", error);
    return EMPTY_RECORD;
  }
}

function write(record: PricesRecord): void {
  try {
    localStorage.setItem(PRICES_STORAGE_KEY, JSON.stringify(record));
  } catch (error) {
    console.warn("prices write failed", error);
  }
}

function snapshot(): PricesRecord {
  cache ??= read();
  return cache;
}

function emit(): void {
  for (const listener of listeners) listener();
}

function onStorage(event: StorageEvent): void {
  if (event.key !== PRICES_STORAGE_KEY) return;
  cache = null;
  emit();
}

export function subscribePrices(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

export function getPricesSnapshot(): PriceMap {
  return snapshot().prices;
}

export function getServerPricesSnapshot(): PriceMap {
  return EMPTY;
}

export function getFetchedAt(): number | null {
  return snapshot().fetchedAt;
}

export function mergePrices(next: PriceMap): void {
  const record: PricesRecord = {
    fetchedAt: Date.now(),
    prices: { ...getPricesSnapshot(), ...next },
  };
  cache = record;
  write(record);
  emit();
}

export function clearPrices(): void {
  cache = EMPTY_RECORD;
  write(EMPTY_RECORD);
  emit();
}
