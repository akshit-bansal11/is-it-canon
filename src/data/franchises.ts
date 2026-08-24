import data from "@/data/franchises.json";
import type { Franchise } from "@/types/canon/canon";

export const FRANCHISES = data as readonly Franchise[];

export const ALL_ENTRIES = FRANCHISES.flatMap((franchise) =>
  franchise.games.map((game) => ({ game, franchise })),
);
