import { PLATFORM_FILTERS, UNSET_FILTER } from "@/constants/canon/filters";
import type { Entry } from "@/types/canon/canon";
import type { FilterState } from "@/types/canon/table";
import type { UserEntries } from "@/types/canon/user";

function haystack(entry: Entry): string {
  const { game, franchise } = entry;
  return [
    game.title,
    game.version,
    game.platform,
    game.storefront,
    game.note,
    franchise.name,
    String(game.year),
    ...game.editions.map((edition) => edition.name),
  ]
    .join(" ")
    .toLowerCase();
}

function matchesPlatform(platform: string, filter: string): boolean {
  const target = PLATFORM_FILTERS.find((option) => option.id === filter);
  return target === undefined || platform.includes(target.match);
}

export function filterEntries(
  entries: readonly Entry[],
  filter: FilterState,
  userEntries: UserEntries,
): Entry[] {
  const needle = filter.query.trim().toLowerCase();

  return entries.filter((entry) => {
    const user = userEntries[entry.game.id];

    if (filter.status === UNSET_FILTER && user?.status !== undefined) return false;
    if (filter.status !== "" && filter.status !== UNSET_FILTER && user?.status !== filter.status) {
      return false;
    }
    if (filter.tier !== "" && entry.game.tier !== filter.tier) return false;
    if (filter.device !== "" && user?.device !== filter.device) return false;
    if (filter.storefront !== "" && user?.storefront !== filter.storefront) return false;
    if (!matchesPlatform(entry.game.platform, filter.platform)) return false;

    return needle === "" || haystack(entry).includes(needle);
  });
}
