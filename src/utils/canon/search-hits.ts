import type { Franchise } from "@/types/canon/canon";
import type { SearchHit } from "@/types/canon/search";

/** 0 = no match. Higher is a better match; a prefix beats a word start beats a substring. */
function score(haystack: string, needle: string): number {
  const text = haystack.toLowerCase();
  const at = text.indexOf(needle);
  if (at === -1) return 0;
  if (at === 0) return 3;
  return text[at - 1] === " " ? 2 : 1;
}

export function matchesFranchise(franchise: Franchise, needle: string): boolean {
  if (needle === "") return true;
  if (score(franchise.name, needle) > 0) return true;
  return franchise.games.some((game) => score(game.title, needle) > 0);
}

/**
 * Franchises and games in one ranked list for the command palette. Games rank
 * below franchises at equal score, because typing "mass" almost always means
 * "take me to Mass Effect" rather than "take me to one row inside it".
 */
export function searchHits(
  query: string,
  franchises: readonly Franchise[],
  limit: number,
): SearchHit[] {
  const needle = query.trim().toLowerCase();
  if (needle === "") return [];

  const ranked: { hit: SearchHit; rank: number }[] = [];

  for (const franchise of franchises) {
    const own = score(franchise.name, needle);
    if (own > 0) {
      // The bonus is larger than one whole score step on purpose: typing "zel"
      // should offer The Legend of Zelda before Zelda II, even though the game
      // title is the closer prefix match.
      ranked.push({
        rank: own * 10 + 15,
        hit: {
          kind: "franchise",
          id: franchise.id,
          franchiseId: franchise.id,
          label: franchise.name,
          sub: `${franchise.games.length} games`,
        },
      });
    }

    for (const game of franchise.games) {
      const hit = score(game.title, needle);
      if (hit === 0) continue;
      ranked.push({
        rank: hit * 10,
        hit: {
          kind: "game",
          id: game.id,
          franchiseId: franchise.id,
          label: game.title,
          sub: `${franchise.name} · ${game.year}`,
        },
      });
    }
  }

  return ranked
    .sort((a, b) => b.rank - a.rank || a.hit.label.localeCompare(b.hit.label))
    .slice(0, limit)
    .map((item) => item.hit);
}
