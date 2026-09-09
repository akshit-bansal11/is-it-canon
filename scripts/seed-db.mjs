#!/usr/bin/env node

// Loads the authored datasets into Neon and verifies what landed.
//
// This is a script, not an endpoint. Nothing here ships to the browser and
// nothing exposes a way to replace the dataset over the network — the only
// protection it needs is that DATABASE_URL is server-side.
//
// Idempotent by full replacement rather than upsert: the JSON files are
// complete snapshots, so a partial update would strand rows deleted upstream.
// Running it twice leaves the same state as running it once.
//
// Usage: node --env-file=.env.local scripts/seed-db.mjs

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set. Add it to .env.local, then re-run.");
  process.exit(1);
}

const sql = neon(url);
const read = (name) =>
  JSON.parse(readFileSync(fileURLToPath(new URL(`../src/data/${name}`, import.meta.url)), "utf8"));

const franchises = read("franchises.json");
const screen = read("screen.json");

// The schema is created here rather than through drizzle-kit migrations. The
// dataset is a snapshot that is always reseeded whole, so there is no state to
// migrate between versions — the table either matches the current shape or is
// rebuilt. If this ever grows per-user rows that must survive a schema change,
// that stops being true and drizzle-kit earns its place.
await sql`DROP TABLE IF EXISTS games`;
await sql`DROP TABLE IF EXISTS franchises`;
await sql`DROP TABLE IF EXISTS screen_franchises`;

await sql`
  CREATE TABLE franchises (
    id          text PRIMARY KEY,
    sort_order  integer NOT NULL,
    name        text NOT NULL,
    scope       text NOT NULL,
    caveat      text NOT NULL,
    arcs        jsonb
  )`;

await sql`
  CREATE TABLE games (
    id           text PRIMARY KEY,
    franchise_id text NOT NULL REFERENCES franchises(id) ON DELETE CASCADE,
    sort_order   integer NOT NULL,
    arc          text,
    title        text NOT NULL,
    year         integer NOT NULL,
    version      text NOT NULL,
    platform     text NOT NULL,
    msrp         text NOT NULL,
    hours        double precision,
    tier         text NOT NULL,
    starter      boolean NOT NULL,
    store        text NOT NULL,
    query        text NOT NULL,
    storefront   text NOT NULL,
    note         text NOT NULL,
    editions     jsonb NOT NULL,
    sources      jsonb,
    market       jsonb,
    igdb         jsonb,
    authored     jsonb
  )`;

await sql`
  CREATE TABLE screen_franchises (
    id          text PRIMARY KEY,
    sort_order  integer NOT NULL,
    title       text NOT NULL,
    description text NOT NULL,
    source      text NOT NULL,
    groups      jsonb NOT NULL,
    entries     jsonb NOT NULL
  )`;

await sql`CREATE INDEX franchises_order_idx ON franchises (sort_order)`;
await sql`CREATE INDEX games_franchise_order_idx ON games (franchise_id, sort_order)`;
await sql`CREATE INDEX screen_franchises_order_idx ON screen_franchises (sort_order)`;

let gameCount = 0;

for (const [order, franchise] of franchises.entries()) {
  await sql`
    INSERT INTO franchises (id, sort_order, name, scope, caveat, arcs)
    VALUES (${franchise.id}, ${order}, ${franchise.name}, ${franchise.scope}, ${franchise.caveat},
            ${franchise.arcs === undefined ? null : JSON.stringify(franchise.arcs)})`;

  for (const game of franchise.games) {
    await sql`
      INSERT INTO games (id, franchise_id, sort_order, arc, title, year, version, platform, msrp,
                         hours, tier, starter, store, query, storefront, note,
                         editions, sources, market, igdb, authored)
      VALUES (${game.id}, ${franchise.id}, ${game.order}, ${game.arc ?? null}, ${game.title},
              ${game.year}, ${game.version}, ${game.platform}, ${game.msrp}, ${game.hours},
              ${game.tier}, ${game.starter}, ${game.store}, ${game.query}, ${game.storefront},
              ${game.note}, ${JSON.stringify(game.editions)},
              ${game.sources === undefined ? null : JSON.stringify(game.sources)},
              ${game.market === undefined ? null : JSON.stringify(game.market)},
              ${game.igdb === undefined ? null : JSON.stringify(game.igdb)},
              ${game.authored === undefined ? null : JSON.stringify(game.authored)})`;
    gameCount += 1;
  }
}

for (const franchise of screen) {
  await sql`
    INSERT INTO screen_franchises (id, sort_order, title, description, source, groups, entries)
    VALUES (${franchise.id}, ${franchise.order}, ${franchise.title}, ${franchise.description},
            ${franchise.source}, ${JSON.stringify(franchise.groups)},
            ${JSON.stringify(franchise.entries)})`;
}

// Read back rather than trusting the inserts. An import that exits zero is not
// evidence it moved everything; the database agreeing with the authored files
// is. Orphans matter because they are silent — a game whose franchise_id or arc
// matches nothing simply stops appearing, with no error anywhere.
const [counts] = await sql`
  SELECT
    (SELECT count(*) FROM franchises)                                        AS franchises,
    (SELECT count(*) FROM games)                                             AS games,
    (SELECT coalesce(sum(jsonb_array_length(arcs)), 0) FROM franchises)      AS arcs,
    (SELECT count(*) FROM screen_franchises)                                 AS screen_franchises,
    (SELECT coalesce(sum(jsonb_array_length(entries)), 0)
       FROM screen_franchises)                                               AS screen_entries,
    (SELECT count(*) FROM games g
       WHERE NOT EXISTS (SELECT 1 FROM franchises f WHERE f.id = g.franchise_id))
                                                                             AS orphaned_games,
    (SELECT count(*) FROM games g JOIN franchises f ON f.id = g.franchise_id
       WHERE g.arc IS NOT NULL
         AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements(coalesce(f.arcs, '[]'::jsonb)) a
                         WHERE a->>'id' = g.arc))                            AS orphaned_arcs`;

const expected = {
  franchises: franchises.length,
  games: gameCount,
  arcs: franchises.reduce((total, f) => total + (f.arcs?.length ?? 0), 0),
  screen_franchises: screen.length,
  screen_entries: screen.reduce((total, f) => total + f.entries.length, 0),
};

let failed = false;
for (const [key, want] of Object.entries(expected)) {
  const got = Number(counts[key]);
  const ok = got === want;
  if (!ok) failed = true;
  console.log(
    `${ok ? "ok  " : "FAIL"} ${key.padEnd(18)} ${String(got).padStart(4)} (expected ${want})`,
  );
}
for (const key of ["orphaned_games", "orphaned_arcs"]) {
  const got = Number(counts[key]);
  if (got !== 0) failed = true;
  console.log(
    `${got === 0 ? "ok  " : "FAIL"} ${key.padEnd(18)} ${String(got).padStart(4)} (expected 0)`,
  );
}

if (failed) {
  console.error("\nSeed did not match the authored data.");
  process.exit(1);
}
console.log("\nSeed verified against the authored files.");
