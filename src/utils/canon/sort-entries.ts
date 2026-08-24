import { TIER_RANK } from "@/constants/canon/tiers";
import type { Entry } from "@/types/canon/canon";
import type { PriceMap } from "@/types/canon/price";
import type { SortKey, SortState } from "@/types/canon/table";
import type { Status, UserEntries } from "@/types/canon/user";
import { parsePrice } from "@/utils/canon/price";

const STATUS_RANK: Record<Status, number> = {
  playing: 0,
  completed: 1,
  backlogged: 2,
  wishlist: 3,
  dropped: 4,
  trash: 5,
};

export interface SortContext {
  userEntries: UserEntries;
  prices: PriceMap;
}

function sortValue(entry: Entry, key: SortKey, context: SortContext): string | number | null {
  const { game } = entry;
  switch (key) {
    case "franchise":
      return entry.franchise.name.toLowerCase();
    case "title":
    case "version":
    case "platform":
      return game[key].toLowerCase();
    case "status": {
      const status = context.userEntries[game.id]?.status;
      return status === undefined ? null : STATUS_RANK[status];
    }
    case "msrp":
      return parsePrice(game.msrp);
    case "now":
      return context.prices[game.id]?.amount ?? null;
    case "tier":
      return TIER_RANK[game.tier];
    default:
      return game[key];
  }
}

export function sortEntries(
  entries: readonly Entry[],
  sort: SortState,
  context: SortContext,
): Entry[] {
  return [...entries].sort((a, b) => {
    const left = sortValue(a, sort.key, context);
    const right = sortValue(b, sort.key, context);
    if (left === null && right === null) return a.game.order - b.game.order;
    if (left === null) return 1;
    if (right === null) return -1;
    if (left < right) return -sort.direction;
    if (left > right) return sort.direction;
    return a.game.order - b.game.order;
  });
}
