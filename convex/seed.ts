import data from "../src/data/franchises.json";
import type { Franchise } from "../src/types/canon/canon";
import { internalMutation } from "./_generated/server";

/**
 * Loads the authored canon dataset into Convex.
 *
 * An `internalMutation`, so it is callable by the deployer through
 * `npx convex run seed:run` and by nothing else. A public mutation that
 * replaced the whole dataset would be an unauthenticated wipe for anyone who
 * read the deployment URL out of the client bundle, and that URL is public by
 * design.
 *
 * Idempotent by full replacement rather than by upsert: the JSON is a complete
 * snapshot, so a partial update would leave behind any row deleted upstream.
 * Running it twice leaves the same state as running it once.
 *
 * The dataset is imported straight from `src/data/franchises.json` and typed as
 * the same `Franchise` the app uses, so there is one authored copy, and a shape
 * the schema disagrees with fails to compile here rather than at insert time.
 */
export const run = internalMutation({
  args: {},
  handler: async (ctx) => {
    for (const existing of await ctx.db.query("games").collect()) {
      await ctx.db.delete(existing._id);
    }
    for (const existing of await ctx.db.query("franchises").collect()) {
      await ctx.db.delete(existing._id);
    }

    // JSON modules widen to their literal inference, so the shape has to be
    // asserted once at the boundary. This mirrors how src/data/franchises.ts
    // already types the same import.
    const franchises = data as unknown as readonly Franchise[];
    let games = 0;

    for (const { games: franchiseGames, ...franchise } of franchises) {
      await ctx.db.insert("franchises", franchise);

      for (const game of franchiseGames) {
        await ctx.db.insert("games", { ...game, franchiseId: franchise.id });
        games += 1;
      }
    }

    return { franchises: franchises.length, games };
  },
});
