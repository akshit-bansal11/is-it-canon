import type { Game } from "@/types/canon/canon";
import type { PriceQuote } from "@/types/canon/price";
import { isStoredQuote, resolveQuote } from "@/utils/canon/resolve-quote";
import { storeUrl } from "@/utils/canon/store-url";
import { cn } from "@/utils/cn";

interface PriceCellProps {
  game: Game;
  quote: PriceQuote | undefined;
}

export default function PriceCell({ game, quote }: PriceCellProps) {
  const shown = resolveQuote(game, quote);
  const stored = isStoredQuote(game, quote);
  const href = shown === null || shown.url === "" ? storeUrl(game) : shown.url;

  return (
    <a
      className="inline-flex flex-col items-end underline decoration-edge underline-offset-2 transition-[text-decoration-color] duration-[160ms] hover:decoration-ink motion-reduce:transition-none"
      href={href}
      rel="noreferrer"
      target="_blank"
      title={
        stored
          ? `Last fetched ${game.sources?.fetchedAt?.slice(0, 10) ?? "earlier"}`
          : `Open ${game.title} on ${shown?.shop ?? game.storefront}`
      }
    >
      {shown === null ? (
        <span className="text-faint">check</span>
      ) : (
        <>
          <span className={cn(stored ? "text-muted" : "text-ink")}>
            {shown.currency === "USD" ? "$" : ""}
            {shown.amount.toFixed(2)}
          </span>
          <span className="text-[10px] text-faint">
            {shown.shop}
            {shown.cut > 0 ? ` −${shown.cut}%` : ""}
          </span>
        </>
      )}
    </a>
  );
}
