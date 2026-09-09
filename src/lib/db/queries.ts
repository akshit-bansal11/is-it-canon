import { asc } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { franchises, games, screenFranchises } from "@/lib/db/schema";
import type { Franchise } from "@/types/canon/canon";
import type { ScreenFranchise } from "@/types/canon/screen";

/**
 * The whole canon dataset, shaped exactly like the app's `Franchise[]`.
 *
 * Two reads and an in-memory group rather than a join: the join would return
 * every franchise's columns repeated once per game, and the result has to be
 * nested for the client anyway. 126 plus 690 rows is nothing to group.
 *
 * Read whole rather than paginated. The app filters, sorts and searches on the
 * client because that is what makes the table instant; paginating here would
 * trade that for a round trip per keystroke. The pages calling this are
 * statically generated, so it runs at build and revalidation time, not per
 * visitor.
 */
export async function listFranchises(): Promise<Franchise[]> {
  const database = db();

  const [franchiseRows, gameRows] = await Promise.all([
    database.select().from(franchises).orderBy(asc(franchises.order)),
    database.select().from(games).orderBy(asc(games.order)),
  ]);

  const byFranchise = new Map<string, typeof gameRows>();
  for (const game of gameRows) {
    const bucket = byFranchise.get(game.franchiseId);
    if (bucket === undefined) byFranchise.set(game.franchiseId, [game]);
    else bucket.push(game);
  }

  return franchiseRows.map((franchise) => ({
    id: franchise.id,
    name: franchise.name,
    scope: franchise.scope,
    caveat: franchise.caveat,
    ...(franchise.arcs === null ? {} : { arcs: franchise.arcs }),
    games: (byFranchise.get(franchise.id) ?? []).map((game) => ({
      id: game.id,
      order: game.order,
      ...(game.arc === null ? {} : { arc: game.arc }),
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
      ...(game.sources === null ? {} : { sources: game.sources }),
      ...(game.market === null ? {} : { market: game.market }),
      ...(game.igdb === null ? {} : { igdb: game.igdb }),
      ...(game.authored === null ? {} : { authored: game.authored }),
    })),
  }));
}

/** Every screen chronology, in authored order. */
export async function listScreen(): Promise<ScreenFranchise[]> {
  const rows = await db().select().from(screenFranchises).orderBy(asc(screenFranchises.order));

  return rows.map((row) => ({
    id: row.id,
    order: row.order,
    title: row.title,
    description: row.description,
    source: row.source,
    groups: row.groups,
    entries: row.entries,
  }));
}

/**
 * Counts for the landing page, so the section cards state what is actually
 * stored rather than a number typed into the markup and left to rot. Books has
 * no dataset and reports zero, which is the honest answer.
 */
export async function sectionCounts() {
  const [franchiseRows, gameRows, screenRows] = await Promise.all([
    db().select({ id: franchises.id }).from(franchises),
    db().select({ id: games.id }).from(games),
    db().select({ entries: screenFranchises.entries }).from(screenFranchises),
  ]);

  return {
    games: { franchises: franchiseRows.length, entries: gameRows.length },
    screen: {
      franchises: screenRows.length,
      // Markers are chronology annotations, not things to watch, so they are
      // not counted as entries a reader could sit down to.
      entries: screenRows.reduce(
        (total, row) => total + row.entries.filter((entry) => entry.kind === "title").length,
        0,
      ),
    },
    books: { franchises: 0, entries: 0 },
  };
}
