import type { Doc } from "./_generated/dataModel";
import { query } from "./_generated/server";

/**
 * The whole canon dataset, shaped exactly like the authored JSON it replaced.
 *
 * Returns franchises in authored order, each carrying its games in story order,
 * with Convex's `_id` and `_creationTime`, the denormalised `franchiseId` and
 * the sort-only `order` fields removed. That shape is deliberate: it is what
 * `Franchise[]` in `src/types/canon/canon.ts` already describes, so the read
 * swap touched the component that loads the data and nothing that renders it.
 *
 * Read whole rather than paginated. The dataset is 690 games and roughly 675 KB,
 * comfortably inside Convex's per-query limits, and the app filters, sorts and
 * searches on the client because that is what makes the table feel instant.
 * Paginating here would trade a fast local interaction for a round trip per
 * keystroke. The page that calls it is statically generated and revalidated, so
 * in practice this runs at build and revalidation time, not per visitor.
 *
 * The projections below are written out field by field rather than destructured
 * with a rest element. It is more lines, but this function defines the wire
 * contract between the database and every component downstream, and an explicit
 * list is the only version of it that cannot silently start shipping a new
 * column the day one is added to the schema.
 */

function toGame(game: Doc<"games">) {
  return {
    id: game.id,
    order: game.order,
    arc: game.arc,
    title: game.title,
    year: game.year,
    version: game.version,
    platform: game.platform,
    msrp: game.msrp,
    hours: game.hours,
    tier: game.tier,
    starter: game.starter,
    store: game.store,
    query: game.query,
    storefront: game.storefront,
    note: game.note,
    editions: game.editions,
    sources: game.sources,
    market: game.market,
    igdb: game.igdb,
    authored: game.authored,
  };
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const franchises = await ctx.db.query("franchises").withIndex("by_order").collect();
    const games = await ctx.db.query("games").collect();

    const byFranchise = new Map<string, Doc<"games">[]>();
    for (const game of games) {
      const bucket = byFranchise.get(game.franchiseId);
      if (bucket === undefined) byFranchise.set(game.franchiseId, [game]);
      else bucket.push(game);
    }

    return franchises.map((franchise) => ({
      id: franchise.id,
      name: franchise.name,
      scope: franchise.scope,
      caveat: franchise.caveat,
      arcs: franchise.arcs,
      games: (byFranchise.get(franchise.id) ?? [])
        .sort((left, right) => left.order - right.order)
        .map(toGame),
    }));
  },
});
