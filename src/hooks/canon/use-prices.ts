"use client";

import { useCallback, useState } from "react";
import type { Game } from "@/types/canon/canon";
import type { PriceMap, PriceStatus } from "@/types/canon/price";

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

export interface UsePrices {
  prices: PriceMap;
  status: PriceStatus;
  message: string;
  refresh: (games: readonly Game[]) => void;
}

export function usePrices(): UsePrices {
  const [prices, setPrices] = useState<PriceMap>({});
  const [status, setStatus] = useState<PriceStatus>("idle");
  const [message, setMessage] = useState("");

  const refresh = useCallback((games: readonly Game[]) => {
    if (games.length === 0) return;
    setStatus("loading");
    setMessage("");

    const body = JSON.stringify({
      games: games.map((game) => ({ id: game.id, query: game.query })),
    });

    fetch("/api/prices", { method: "POST", headers: { "content-type": "application/json" }, body })
      .then(async (response) => {
        const payload: unknown = await response.json();
        if (!response.ok)
          throw new Error(readError(payload, `Request failed (${response.status})`));
        return readPrices(payload);
      })
      .then((next) => {
        setPrices((current) => ({ ...current, ...next }));
        setStatus("ready");
        setMessage(`${Object.keys(next).length} priced`);
      })
      .catch((error: unknown) => {
        setStatus("error");
        setMessage(error instanceof Error ? error.message : "Price lookup failed.");
      });
  }, []);

  return { prices, status, message, refresh };
}
