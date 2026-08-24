import { NextResponse } from "next/server";
import type { PriceMap, PriceQuote } from "@/types/canon/price";

const LOOKUP_URL = "https://api.isthereanydeal.com/games/lookup/v1";
const PRICES_URL = "https://api.isthereanydeal.com/games/prices/v3";
const MAX_GAMES = 60;

interface RequestedGame {
  id: string;
  query: string;
}

function parseBody(body: unknown): RequestedGame[] | null {
  if (body === null || typeof body !== "object") return null;
  const games = (body as { games?: unknown }).games;
  if (!Array.isArray(games) || games.length === 0 || games.length > MAX_GAMES) return null;

  const parsed: RequestedGame[] = [];
  for (const item of games) {
    if (item === null || typeof item !== "object") return null;
    const { id, query } = item as { id?: unknown; query?: unknown };
    if (typeof id !== "string" || typeof query !== "string" || query === "") return null;
    parsed.push({ id, query });
  }
  return parsed;
}

async function lookupId(title: string, key: string): Promise<string | null> {
  const url = `${LOOKUP_URL}?key=${key}&title=${encodeURIComponent(title)}`;
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) return null;
  const payload: unknown = await response.json();
  const game = (payload as { game?: { id?: unknown } }).game;
  return typeof game?.id === "string" ? game.id : null;
}

function readQuote(entry: unknown): { id: string; quote: PriceQuote } | null {
  if (entry === null || typeof entry !== "object") return null;
  const { id, deals } = entry as { id?: unknown; deals?: unknown };
  if (typeof id !== "string" || !Array.isArray(deals) || deals[0] === undefined) return null;

  const deal = deals[0] as {
    shop?: { name?: unknown };
    price?: { amount?: unknown; currency?: unknown };
    cut?: unknown;
    url?: unknown;
  };
  const amount = deal.price?.amount;
  if (typeof amount !== "number") return null;

  return {
    id,
    quote: {
      amount,
      currency: typeof deal.price?.currency === "string" ? deal.price.currency : "USD",
      shop: typeof deal.shop?.name === "string" ? deal.shop.name : "Unknown",
      cut: typeof deal.cut === "number" ? deal.cut : 0,
      url: typeof deal.url === "string" ? deal.url : "",
    },
  };
}

export async function POST(request: Request): Promise<NextResponse> {
  const key = process.env.ITAD_API_KEY;
  if (key === undefined || key === "") {
    return NextResponse.json(
      { error: "ITAD_API_KEY is not set. Add it to .env.local and restart the dev server." },
      { status: 501 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed JSON body." }, { status: 400 });
  }

  const games = parseBody(body);
  if (games === null) {
    return NextResponse.json(
      { error: `Expected { games: [{ id, query }] } with 1-${MAX_GAMES} entries.` },
      { status: 400 },
    );
  }

  try {
    const looked = await Promise.all(
      games.map(async (game) => ({ game, itadId: await lookupId(game.query, key) })),
    );
    const byItadId = new Map<string, string>();
    for (const { game, itadId } of looked) {
      if (itadId !== null && !byItadId.has(itadId)) byItadId.set(itadId, game.id);
    }
    if (byItadId.size === 0) return NextResponse.json({ prices: {} });

    const response = await fetch(`${PRICES_URL}?key=${key}&country=US&capacity=1`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify([...byItadId.keys()]),
      cache: "no-store",
    });
    if (!response.ok) {
      return NextResponse.json(
        { error: `IsThereAnyDeal responded ${response.status}.` },
        { status: 502 },
      );
    }

    const payload: unknown = await response.json();
    const prices: PriceMap = {};
    if (Array.isArray(payload)) {
      for (const entry of payload) {
        const read = readQuote(entry);
        const gameId = read === null ? undefined : byItadId.get(read.id);
        if (read !== null && gameId !== undefined) prices[gameId] = read.quote;
      }
    }
    return NextResponse.json({ prices });
  } catch (error) {
    console.error("price refresh failed", error);
    return NextResponse.json({ error: "Price lookup failed." }, { status: 502 });
  }
}
