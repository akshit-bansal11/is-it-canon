import type { Franchise } from "@/types/canon/canon";
import type { FranchiseStats } from "@/types/canon/stats";
import type { UserEntries } from "@/types/canon/user";

export function statsFor(franchise: Franchise, userEntries: UserEntries): FranchiseStats {
  let tracked = 0;
  let completed = 0;
  let hours = 0;

  for (const game of franchise.games) {
    const status = userEntries[game.id]?.status;
    if (status !== undefined) tracked += 1;
    if (status === "completed") completed += 1;
    hours += game.hours ?? 0;
  }

  return {
    total: franchise.games.length,
    tracked,
    completed,
    hours,
    arcs: franchise.arcs?.length ?? 0,
  };
}
