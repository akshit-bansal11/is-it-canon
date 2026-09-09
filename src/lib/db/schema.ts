import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  text,
} from "drizzle-orm/pg-core";
import type {
  Arc,
  Edition,
  GameAuthored,
  GameIgdb,
  GameMarket,
  GameSources,
  StoreKind,
  Tier,
} from "@/types/canon/canon";
import type { ScreenEntry, ScreenGroup } from "@/types/canon/screen";

/**
 * Canon data in Neon Postgres — 126 franchises, 690 games, 6 screen chronologies.
 *
 * Column types mirror `src/types/canon/canon.ts` through `$type<T>()`, so the
 * database and the app agree by construction and a read needs no mapping layer.
 * The `Game` and `Franchise` interfaces are the contract every component is
 * written against, so a store matching them keeps a change of database confined
 * to the loader — which is what made swapping one out cheap.
 *
 * The composite sub-objects — editions, market, igdb, sources, arcs, and the
 * screen groups and entries — stay as `jsonb` rather than being normalised into
 * their own tables. They are read and written whole, never queried across, and
 * never joined on. Six more tables would buy nothing but joins.
 *
 * `order` is a reserved word in SQL, so the columns are named `sort_order` and
 * mapped back to `order` in TypeScript. The alternative is quoting the
 * identifier in every hand-written statement, which works right up until the
 * one place someone forgets.
 */

export const franchises = pgTable(
  "franchises",
  {
    id: text("id").primaryKey(),
    order: integer("sort_order").notNull(),
    name: text("name").notNull(),
    scope: text("scope").notNull(),
    caveat: text("caveat").notNull(),
    /** Present only where a franchise splits into storylines that stand alone. */
    arcs: jsonb("arcs").$type<Arc[]>(),
  },
  (table) => [index("franchises_order_idx").on(table.order)],
);

export const games = pgTable(
  "games",
  {
    id: text("id").primaryKey(),
    franchiseId: text("franchise_id")
      .notNull()
      .references(() => franchises.id, { onDelete: "cascade" }),
    order: integer("sort_order").notNull(),
    /** Matches an `arcs[].id` on the parent franchise, where it has arcs. */
    arc: text("arc"),
    title: text("title").notNull(),
    year: integer("year").notNull(),
    version: text("version").notNull(),
    platform: text("platform").notNull(),
    msrp: text("msrp").notNull(),
    /** Double rather than integer: playtimes are not whole hours. */
    hours: doublePrecision("hours"),
    tier: text("tier").$type<Tier>().notNull(),
    starter: boolean("starter").notNull(),
    store: text("store").$type<StoreKind>().notNull(),
    query: text("query").notNull(),
    storefront: text("storefront").notNull(),
    note: text("note").notNull(),
    editions: jsonb("editions").$type<Edition[]>().notNull(),
    sources: jsonb("sources").$type<GameSources>(),
    market: jsonb("market").$type<GameMarket>(),
    igdb: jsonb("igdb").$type<GameIgdb>(),
    authored: jsonb("authored").$type<GameAuthored>(),
  },
  // Compound, so a franchise's games come back already in story order rather
  // than sorting 690 rows to find the dozen that were wanted.
  (table) => [index("games_franchise_order_idx").on(table.franchiseId, table.order)],
);

/**
 * Movies and series chronologies. Entries are nested rather than split into
 * their own table: 339 across six rows, read whole, never queried across.
 */
export const screenFranchises = pgTable(
  "screen_franchises",
  {
    id: text("id").primaryKey(),
    order: integer("sort_order").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    /** Which merge source it came from. The two disagree about scope, and a
     *  reader deserves to know which chronology they are looking at. */
    source: text("source").notNull(),
    groups: jsonb("groups").$type<ScreenGroup[]>().notNull(),
    entries: jsonb("entries").$type<ScreenEntry[]>().notNull(),
  },
  (table) => [index("screen_franchises_order_idx").on(table.order)],
);
