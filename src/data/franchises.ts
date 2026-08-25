import data from "@/data/franchises.json";
import type { Entry, Franchise } from "@/types/canon/canon";

export const FRANCHISES = data as readonly Franchise[];

export const ALL_ENTRIES: readonly Entry[] = FRANCHISES.flatMap((franchise) =>
  franchise.games.map((game) => ({ game, franchise })),
);

/** Id lookup for the detail drawer and the palette, built once rather than
 *  scanning nine hundred entries on every render. */
export const ENTRY_BY_ID = new Map(ALL_ENTRIES.map((entry) => [entry.game.id, entry]));
