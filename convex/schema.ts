import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Canon data — 126 franchises, 690 games, 104 storylines.
 *
 * Mirrors `src/types/canon/canon.ts` field for field, deliberately. The app's
 * `Game` and `Franchise` interfaces are the contract every component is written
 * against, so the database matching them means the read path can hand documents
 * straight to the existing components with nothing but `_id` and `_creationTime`
 * stripped. A "tidier" schema here would have bought a rename across 690 records
 * and every component that reads one.
 *
 * The slug fields are named `id` rather than `slug` for the same reason: it is
 * what the app already calls them. Only `_id` and `_creationTime` are reserved
 * in Convex, so a plain `id` is legal — just never confuse the two. `_id` is the
 * Convex document handle; `id` is the stable human slug like "zelda-botw" that
 * appears in URLs and in the tracker's localStorage keys.
 */

const edition = v.object({
  name: v.string(),
  year: v.number(),
  platforms: v.string(),
  recommended: v.boolean(),
  note: v.string(),
});

const arc = v.object({
  id: v.string(),
  name: v.string(),
  blurb: v.string(),
});

/** Provenance for the enriched fields. Absent on games enrichment never matched. */
const sources = v.object({
  itadId: v.union(v.string(), v.null()),
  igdbId: v.union(v.number(), v.null()),
  igdbSlug: v.union(v.string(), v.null()),
  matchConfidence: v.union(v.literal("exact"), v.literal("fuzzy"), v.literal("none")),
  fetchedAt: v.string(),
});

/** Pricing from IsThereAnyDeal, US region. Every field nullable: a game can be
 *  matched but delisted, in which case there is an id but no price. */
const market = v.object({
  regular: v.union(v.number(), v.null()),
  best: v.union(v.number(), v.null()),
  shop: v.union(v.string(), v.null()),
  cut: v.union(v.number(), v.null()),
  historicalLow: v.union(v.number(), v.null()),
  url: v.union(v.string(), v.null()),
});

/** Catalogue facts from IGDB. */
const igdb = v.object({
  releaseYear: v.union(v.number(), v.null()),
  platforms: v.array(v.string()),
  rating: v.union(v.number(), v.null()),
  ratingCount: v.union(v.number(), v.null()),
  genres: v.array(v.string()),
  hoursMain: v.union(v.number(), v.null()),
  hoursComplete: v.union(v.number(), v.null()),
});

/** Hand-authored values, retained so enrichment re-runs stay comparable. */
const authored = v.object({
  year: v.number(),
  hours: v.union(v.number(), v.null()),
  msrp: v.string(),
  version: v.string(),
});

export default defineSchema({
  franchises: defineTable({
    id: v.string(),
    /** Authored position in the dataset. Carried explicitly rather than relying
     *  on `_creationTime` matching seed order — that happens to be true today
     *  and would break silently the first time a single franchise was re-inserted. */
    order: v.number(),
    name: v.string(),
    scope: v.string(),
    caveat: v.string(),
    /** Present only where a franchise splits into storylines that stand alone. */
    arcs: v.optional(v.array(arc)),
    // Convex reserves the index names "by_id" and "by_creation_time", so the
    // slug lookup is "by_public_id" — `id` here is the human slug, not `_id`.
  })
    .index("by_public_id", ["id"])
    .index("by_order", ["order"]),

  games: defineTable({
    id: v.string(),
    /** Denormalised parent slug rather than a Convex reference. The seed data is
     *  keyed by slug, the app routes by slug, and a join on every read would buy
     *  nothing that this does not. */
    franchiseId: v.string(),
    order: v.number(),
    /** Matches an `arcs[].id` on the parent franchise, where the franchise has arcs. */
    arc: v.optional(v.string()),
    title: v.string(),
    year: v.number(),
    version: v.string(),
    platform: v.string(),
    msrp: v.string(),
    hours: v.union(v.number(), v.null()),
    tier: v.union(v.literal("core"), v.literal("opt"), v.literal("skip")),
    starter: v.boolean(),
    store: v.union(v.literal("pc"), v.literal("ps"), v.literal("xb"), v.literal("nin")),
    query: v.string(),
    storefront: v.string(),
    note: v.string(),
    editions: v.array(edition),
    sources: v.optional(sources),
    market: v.optional(market),
    igdb: v.optional(igdb),
    authored: v.optional(authored),
  })
    .index("by_public_id", ["id"])
    // Compound so a franchise page reads its games already in story order,
    // rather than sorting 690 rows to find the dozen it wants.
    .index("by_franchise", ["franchiseId", "order"]),
});
