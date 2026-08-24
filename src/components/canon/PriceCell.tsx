import type { Game } from "@/types/canon/canon";
import type { PriceQuote } from "@/types/canon/price";
import { storeUrl } from "@/utils/canon/store-url";

interface PriceCellProps {
  game: Game;
  quote: PriceQuote | undefined;
}

export default function PriceCell({ game, quote }: PriceCellProps) {
  const href = quote?.url === undefined || quote.url === "" ? storeUrl(game) : quote.url;

  return (
    <a
      className="inline-flex flex-col items-end underline decoration-edge underline-offset-2 hover:decoration-ink"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      {quote === undefined ? (
        <span className="text-faint">check</span>
      ) : (
        <>
          <span className="text-ink">
            {quote.currency === "USD" ? "$" : ""}
            {quote.amount.toFixed(2)}
          </span>
          <span className="text-[10px] text-faint">
            {quote.shop}
            {quote.cut > 0 ? ` −${quote.cut}%` : ""}
          </span>
        </>
      )}
    </a>
  );
}
