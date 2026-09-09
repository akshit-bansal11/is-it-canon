import type { Game } from "@/types/canon/canon";
import type { PriceQuote } from "@/types/canon/price";

/**
 * The price to show in the Now column, from whichever source has one.
 *
 * A live lookup wins, but the dataset already carries a real ITAD figure for
 * every enriched game — leaving the column empty until a rate-limited fetch
 * succeeds threw that away and showed "check" on a row whose price was sitting
 * in the JSON the whole time.
 */
export function resolveQuote(game: Game, live: PriceQuote | undefined): PriceQuote | null {
  if (live !== undefined) return live;

  const market = game.market;
  if (market === undefined || market.best === null || market.best <= 0) return null;

  return {
    amount: market.best,
    currency: "USD",
    shop: market.shop ?? "IsThereAnyDeal",
    cut: market.cut ?? 0,
    url: market.url ?? "",
  };
}

/** True when the quote came from the dataset rather than a lookup this session. */
export function isStoredQuote(game: Game, live: PriceQuote | undefined): boolean {
  return live === undefined && resolveQuote(game, live) !== null;
}
