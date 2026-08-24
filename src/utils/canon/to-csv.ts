import { TIER_LABEL } from "@/constants/canon/tiers";
import type { Entry } from "@/types/canon/canon";
import type { PriceMap } from "@/types/canon/price";
import type { UserEntries } from "@/types/canon/user";
import { labelFor } from "@/utils/canon/entry-options";

const HEADER = [
  "Series",
  "#",
  "Game",
  "Status",
  "Device",
  "Store",
  "Year",
  "Best version",
  "Runs on",
  "MSRP",
  "Now",
  "Shop",
  "Hours",
  "Skip?",
  "Notes",
] as const;

function cell(value: string | number | null): string {
  const text = value === null ? "" : String(value);
  return /["\n,]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function toCsv(
  entries: readonly Entry[],
  userEntries: UserEntries,
  prices: PriceMap,
): string {
  const rows = entries.map(({ game, franchise }) => {
    const user = userEntries[game.id];
    const quote = prices[game.id];

    return [
      franchise.name,
      game.order,
      game.title,
      labelFor("status", user?.status),
      labelFor("device", user?.device),
      labelFor("storefront", user?.storefront),
      game.year,
      game.version,
      game.platform,
      game.msrp,
      quote === undefined ? "" : quote.amount.toFixed(2),
      quote?.shop ?? "",
      game.hours,
      TIER_LABEL[game.tier],
      game.note,
    ]
      .map(cell)
      .join(",");
  });

  return [HEADER.join(","), ...rows].join("\n");
}
