import { query } from "./_generated/server";

/**
 * Dataset integrity, read back from the database.
 *
 * Exists so a seed or an import can be verified against the numbers the
 * authored dataset is known to hold — 126 franchises, 690 games, 104
 * storylines — rather than trusting that the import command exited zero.
 * `scripts/check-data.mjs` asserts the same three numbers against the JSON,
 * so the two agreeing is what proves the migration moved everything.
 *
 * Also reports orphans, which counting alone would miss: a game whose
 * `franchiseId` matches no franchise, or whose `arc` matches no arc on its
 * own franchise. Both are silent failures — the row simply stops appearing
 * under its franchise — so they are worth surfacing as a number.
 */
export const counts = query({
  args: {},
  handler: async (ctx) => {
    const franchises = await ctx.db.query("franchises").collect();
    const games = await ctx.db.query("games").collect();

    const arcIdsByFranchise = new Map(
      franchises.map((franchise) => [
        franchise.id,
        new Set((franchise.arcs ?? []).map((entry) => entry.id)),
      ]),
    );

    let orphanedGames = 0;
    let orphanedArcs = 0;
    for (const game of games) {
      const arcIds = arcIdsByFranchise.get(game.franchiseId);
      if (arcIds === undefined) {
        orphanedGames += 1;
        continue;
      }
      if (game.arc !== undefined && !arcIds.has(game.arc)) orphanedArcs += 1;
    }

    return {
      franchises: franchises.length,
      games: games.length,
      arcs: franchises.reduce((total, franchise) => total + (franchise.arcs?.length ?? 0), 0),
      orphanedGames,
      orphanedArcs,
      duplicateGameIds: games.length - new Set(games.map((game) => game.id)).size,
      duplicateFranchiseIds:
        franchises.length - new Set(franchises.map((franchise) => franchise.id)).size,
    };
  },
});
