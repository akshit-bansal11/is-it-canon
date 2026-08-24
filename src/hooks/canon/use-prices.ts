"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { Game } from "@/types/canon/canon";
import type { PriceMap, PriceStatus } from "@/types/canon/price";
import { shouldAutoRefresh } from "@/utils/canon/price-freshness";
import {
  getFetchedAt,
  getPricesSnapshot,
  getServerPricesSnapshot,
  mergePrices,
  subscribePrices,
} from "@/utils/canon/prices-store";

function readError(payload: unknown, fallback: string): string {
  if (payload !== null && typeof payload === "object") {
    const { error } = payload as { error?: unknown };
    if (typeof error === "string") return error;
  }
  return fallback;
}

function readPrices(payload: unknown): PriceMap {
  if (payload === null || typeof payload !== "object") return {};
  const { prices } = payload as { prices?: unknown };
  return prices !== null && typeof prices === "object" ? (prices as PriceMap) : {};
}

function getServerFetchedAt(): number | null {
  return null;
}

function fetchPrices(games: readonly Game[]): Promise<PriceMap> {
  const body = JSON.stringify({
    games: games.map((game) => ({ id: game.id, query: game.query })),
  });

  return fetch("/api/prices", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  }).then(async (response) => {
    const payload: unknown = await response.json();
    if (!response.ok) throw new Error(readError(payload, `Request failed (${response.status})`));
    return readPrices(payload);
  });
}

export interface UsePrices {
  prices: PriceMap;
  fetchedAt: number | null;
  status: PriceStatus;
  message: string;
  refresh: (games: readonly Game[]) => void;
}

export function usePrices(autoGames: readonly Game[]): UsePrices {
  const prices = useSyncExternalStore(subscribePrices, getPricesSnapshot, getServerPricesSnapshot);
  const fetchedAt = useSyncExternalStore(subscribePrices, getFetchedAt, getServerFetchedAt);
  const [status, setStatus] = useState<PriceStatus>("idle");
  const [message, setMessage] = useState("");
  const autoStarted = useRef(false);

  const settle = useCallback((next: PriceMap) => {
    mergePrices(next);
    setStatus("ready");
    setMessage(`${Object.keys(next).length} priced`);
  }, []);

  const fail = useCallback((error: unknown) => {
    setStatus("error");
    setMessage(error instanceof Error ? error.message : "Price lookup failed.");
  }, []);

  const refresh = useCallback(
    (games: readonly Game[]) => {
      if (games.length === 0) return;
      setStatus("loading");
      setMessage("");
      fetchPrices(games).then(settle).catch(fail);
    },
    [settle, fail],
  );

  useEffect(() => {
    if (autoStarted.current || autoGames.length === 0) return;
    if (!shouldAutoRefresh(getFetchedAt(), Date.now())) return;
    autoStarted.current = true;

    // Kick the request off first so every state update lands in a promise
    // continuation — react-hooks/set-state-in-effect forbids synchronous ones.
    const pending = fetchPrices(autoGames);
    Promise.resolve()
      .then(() => {
        setStatus("loading");
        setMessage("");
        return pending;
      })
      .then(settle)
      .catch(fail);
  }, [autoGames, settle, fail]);

  return { prices, fetchedAt, status, message, refresh };
}
