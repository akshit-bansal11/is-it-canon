#!/usr/bin/env node
// Enriches src/data/franchises.json with real IGDB + IsThereAnyDeal data.
// Idempotent: authored values are preserved in an `authored` block and every
// re-run re-derives from those, so running twice is a no-op.
// Usage: npm run data:enrich [-- --refresh]

import { execFileSync } from "node:child_process";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const DATA = join(HERE, "..", "src", "data", "franchises.json");
const CACHE = join(HERE, ".cache");
const REPORT = join(HERE, "enrich-report.md");
const REFRESH = process.argv.includes("--refresh");

const { ITAD_API_KEY, IGDB_CLIENT_ID, IGDB_CLIENT_SECRET } = process.env;
const failures = [];

/** Records an API failure without ever leaking the credential. */
function fail(endpoint, status, detail) {
  failures.push({ endpoint, status, detail });
  console.warn(`  ! ${endpoint} -> HTTP ${status}${detail ? ` (${detail})` : ""}`);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const ATTEMPTS = 5;

/** fetch + JSON, retrying 429/5xx with exponential backoff. Null on failure. */
async function call(endpoint, url, init = {}) {
  let last = "unknown";
  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    if (attempt > 0) await sleep(1000 * 2 ** attempt);
    let res;
    try {
      res = await fetch(url, init);
    } catch (err) {
      last = err.message;
      continue;
    }
    if (res.ok) return res.json();
    last = res.status;
    if (res.status !== 429 && res.status < 500) break;
  }
  fail(endpoint, last);
  return null;
}

// ---------------------------------------------------------------- matching --

const norm = (s) =>
  s
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const tokens = (s) => new Set(norm(s).split(" ").filter(Boolean));

function jaccard(a, b) {
  const A = tokens(a);
  const B = tokens(b);
  if (!A.size || !B.size) return 0;
  let hit = 0;
  for (const t of A) if (B.has(t)) hit++;
  return hit / (A.size + B.size - hit);
}

/** IGDB game_type: 0 main game, 8 remake, 9 remaster, 10 expanded, 11 port. */
const REAL_GAME = new Set([0, 8, 9, 10, 11]);

const ROMAN = /^(i{1,3}|iv|v|vi{1,3}|ix|x|xi{1,2})$/;

/**
 * Sequel designators (arabic or roman) from a title, as a comparable key.
 * Token overlap alone treats "II" as a trivial one-token difference, which is
 * how "Assassin's Creed" scores 0.75 against "Assassin's Creed II" — so the
 * numerals have to match exactly, not just contribute to a similarity score.
 */
const numerals = (s) =>
  norm(s)
    .split(" ")
    .filter((t) => /^\d+$/.test(t) || ROMAN.test(t))
    .sort()
    .join(",");

/**
 * Picks the best IGDB candidate for an authored game.
 * Rejects anything whose release year is >2 off, or whose title is unrelated —
 * a wrong match is far worse than no match.
 */
function pickIgdb(candidates, title, year) {
  const scored = [];
  for (const c of candidates ?? []) {
    if (!c.first_release_date) continue;
    const relYear = new Date(c.first_release_date * 1000).getUTCFullYear();
    if (Math.abs(relYear - year) > 2) continue;
    const exact = norm(c.name) === norm(title);
    if (!exact) {
      if (jaccard(c.name, title) < 0.7) continue;
      if (!REAL_GAME.has(c.game_type)) continue;
      if (numerals(c.name) !== numerals(title)) continue;
    }
    scored.push({
      game: c,
      relYear,
      confidence: exact ? "exact" : "fuzzy",
      rank: [
        exact ? 0 : 1,
        REAL_GAME.has(c.game_type) ? 0 : 1,
        Math.abs(relYear - year),
        -(c.aggregated_rating_count ?? 0),
      ],
    });
  }
  scored.sort((a, b) => {
    for (let i = 0; i < a.rank.length; i++) {
      if (a.rank[i] !== b.rank[i]) return a.rank[i] - b.rank[i];
    }
    return 0;
  });
  return scored[0] ?? null;
}

// -------------------------------------------------------------------- IGDB --

async function igdbToken() {
  if (!IGDB_CLIENT_ID || !IGDB_CLIENT_SECRET) return null;
  const url = `https://id.twitch.tv/oauth2/token?client_id=${IGDB_CLIENT_ID}&client_secret=${IGDB_CLIENT_SECRET}&grant_type=client_credentials`;
  const json = await call("twitch/oauth2/token", url, { method: "POST" });
  return json?.access_token ?? null;
}

function igdbPost(token, path, body) {
  return call(`igdb/${path}`, `https://api.igdb.com/v4/${path}`, {
    method: "POST",
    headers: {
      "Client-ID": IGDB_CLIENT_ID,
      Authorization: `Bearer ${token}`,
      "Content-Type": "text/plain",
    },
    body,
  });
}

const IGDB_FIELDS =
  "fields id,name,slug,first_release_date,aggregated_rating,aggregated_rating_count,platforms.abbreviation,genres.name,url,game_type";

// -------------------------------------------------------------------- ITAD --

const itadUrl = (path, params) =>
  `https://api.isthereanydeal.com/${path}?key=${ITAD_API_KEY}&${params}`;

// ------------------------------------------------------------------- cache --

async function loadCache() {
  await mkdir(CACHE, { recursive: true });
  const map = new Map();
  if (REFRESH) return map;
  for (const file of await readdir(CACHE)) {
    if (!file.endsWith(".json")) continue;
    map.set(file.slice(0, -5), JSON.parse(await readFile(join(CACHE, file), "utf8")));
  }
  return map;
}

const cacheName = (id) => `${id.replace(/[^a-z0-9-]/gi, "_")}.json`;

/** Stamps fetch time on the cache entry, so a cached re-run reports the time
 * the data was actually retrieved and stays byte-identical. */
const stamp = (entry) => {
  entry.fetchedAt = new Date().toISOString();
};

/**
 * Hands written files to the repo's own formatter. `JSON.stringify(x, null, 2)`
 * disagrees with biome (which collapses short arrays onto one line), so without
 * this the data file ping-pongs between this script and `npm run format`, and
 * the cache dir fails a repo-wide `biome check`.
 */
function formatOutputs(...paths) {
  // The JS entry point, not node_modules/.bin — Node refuses to execFile a
  // .cmd shim on Windows, and this needs no shell on any platform.
  const bin = join(HERE, "..", "node_modules", "@biomejs", "biome", "bin", "biome");
  try {
    execFileSync(process.execPath, [bin, "format", "--write", ...paths], { stdio: "ignore" });
  } catch {
    console.warn("  ! biome not available — output left as raw JSON.stringify");
  }
}

// ------------------------------------------------------------------- shape --

const round1 = (n) => Math.round(n * 10) / 10;
const money = (n) => `$${n.toFixed(2)}`;

function buildMarket(prices) {
  if (!prices?.deals?.length) {
    return {
      regular: null,
      best: null,
      shop: null,
      cut: null,
      historicalLow: prices?.historyLow?.all?.amount ?? null,
      url: null,
    };
  }
  const cheapest = (d) => d.price?.amount ?? Number.POSITIVE_INFINITY;
  const best = prices.deals.reduce((lo, d) => (cheapest(d) < cheapest(lo) ? d : lo));
  return {
    regular: best.regular?.amount ?? null,
    best: best.price?.amount ?? null,
    shop: best.shop?.name ?? null,
    cut: best.cut ?? null,
    historicalLow: prices.historyLow?.all?.amount ?? null,
    url: best.url ?? null,
  };
}

function buildIgdb(match, ttb) {
  if (!match) {
    return {
      releaseYear: null,
      platforms: [],
      rating: null,
      ratingCount: null,
      genres: [],
      hoursMain: null,
      hoursComplete: null,
    };
  }
  const g = match.game;
  return {
    releaseYear: match.relYear,
    platforms: (g.platforms ?? []).map((p) => p.abbreviation).filter(Boolean),
    rating: g.aggregated_rating == null ? null : Math.round(g.aggregated_rating),
    ratingCount: g.aggregated_rating_count ?? null,
    genres: (g.genres ?? []).map((x) => x.name).filter(Boolean),
    hoursMain: ttb?.normally ? round1(ttb.normally / 3600) : null,
    hoursComplete: ttb?.completely ? round1(ttb.completely / 3600) : null,
  };
}

// -------------------------------------------------------------------- main --

async function main() {
  console.log(
    `keys found: ITAD_API_KEY=${!!ITAD_API_KEY} IGDB_CLIENT_ID=${!!IGDB_CLIENT_ID} IGDB_CLIENT_SECRET=${!!IGDB_CLIENT_SECRET}`,
  );

  const franchises = JSON.parse(await readFile(DATA, "utf8"));
  const games = franchises.flatMap((f) => f.games);
  const cache = await loadCache();
  const token = await igdbToken();
  if (!token) console.warn("  ! no IGDB token — IGDB fields stay null");

  // Baseline: authored values survive every re-run, so matching and
  // reconciliation always compare against the originals, never against
  // the values a previous run wrote.
  for (const g of games) {
    g.authored ??= { year: g.year, hours: g.hours, msrp: g.msrp, version: g.version };
  }
  // Diff against the authored baseline, not against the previous run's output —
  // that keeps the report identical and reviewable on every re-run.
  const before = new Map(games.map((g) => [g.id, g.authored]));

  // --- phase 1: per-game lookups (cached) ---
  for (const [i, g] of games.entries()) {
    const entry = cache.get(g.id) ?? {};
    cache.set(g.id, entry);
    const searchTitle = g.title.replace(/["‘’]/g, (c) => (c === '"' ? "" : "'"));

    // Only successful responses get cached — a failed call stays `undefined`
    // so the next run retries it instead of freezing a rate-limit miss in.
    if (token && entry.igdbSearch === undefined) {
      const res = await igdbPost(
        token,
        "games",
        `search "${searchTitle}"; ${IGDB_FIELDS}; limit 50;`,
      );
      if (res) {
        entry.igdbSearch = res;
        stamp(entry);
      }
      await sleep(260); // IGDB: 4 req/s
    }
    if (ITAD_API_KEY && entry.itadLookup === undefined) {
      const res = await call(
        "itad/games/lookup/v1",
        itadUrl("games/lookup/v1", `title=${encodeURIComponent(searchTitle)}`),
      );
      if (res) {
        entry.itadLookup = res;
        stamp(entry);
      }
      await sleep(350); // ITAD 429s below ~3 req/s
    }
    if ((i + 1) % 10 === 0) console.log(`  looked up ${i + 1}/${games.length}`);
  }

  // --- phase 2: resolve matches ---
  const matches = new Map();
  for (const g of games) {
    const entry = cache.get(g.id);
    const match = pickIgdb(entry.igdbSearch, g.title, g.authored.year);
    const found = entry.itadLookup?.found ? entry.itadLookup.game : null;
    const itadOk = found && jaccard(found.title, g.title) >= 0.7;
    matches.set(g.id, { match, itad: itadOk ? found : null });
  }

  // --- phase 3: batched time-to-beat ---
  const needTtb = games.filter(
    (g) => matches.get(g.id).match && cache.get(g.id).igdbTtb === undefined,
  );
  for (let i = 0; token && i < needTtb.length; i += 50) {
    const chunk = needTtb.slice(i, i + 50);
    const ids = chunk.map((g) => matches.get(g.id).match.game.id);
    const rows = await igdbPost(
      token,
      "game_time_to_beats",
      `fields game_id,normally,completely; where game_id = (${ids.join(",")}); limit 200;`,
    );
    await sleep(260);
    if (!rows) continue;
    const byId = new Map(rows.map((r) => [r.game_id, r]));
    for (const g of chunk) {
      cache.get(g.id).igdbTtb = byId.get(matches.get(g.id).match.game.id) ?? null;
      stamp(cache.get(g.id));
    }
  }

  // --- phase 4: batched prices (historyLow rides along for free) ---
  const needPrices = games.filter(
    (g) => matches.get(g.id).itad && cache.get(g.id).itadPrices === undefined,
  );
  for (let i = 0; ITAD_API_KEY && i < needPrices.length; i += 20) {
    const chunk = needPrices.slice(i, i + 20);
    const rows = await call("itad/games/prices/v3", itadUrl("games/prices/v3", "country=US"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(chunk.map((g) => matches.get(g.id).itad.id)),
    });
    await sleep(350);
    if (!rows) continue;
    const byId = new Map(rows.map((r) => [r.id, r]));
    for (const g of chunk) {
      cache.get(g.id).itadPrices = byId.get(matches.get(g.id).itad.id) ?? null;
      stamp(cache.get(g.id));
    }
  }

  for (const [id, entry] of cache) {
    entry.fetchedAt ??= new Date().toISOString(); // backfill pre-stamp caches
    await writeFile(join(CACHE, cacheName(id)), `${JSON.stringify(entry, null, 2)}\n`);
  }

  // --- phase 5: write fields + reconcile display values ---
  const fetchedAt = new Date().toISOString();
  const changes = [];
  for (const g of games) {
    const { match, itad } = matches.get(g.id);
    const entry = cache.get(g.id);
    // Only successful responses are cached, so `undefined` means the call
    // failed rather than "the API has nothing". Rewriting a block from a failed
    // call would wipe a previous good run's data on any rate-limited retry, so
    // an unknown block keeps whatever is already there.
    const igdbKnown = entry.igdbSearch !== undefined;
    const itadKnown = entry.itadLookup !== undefined;
    const pricesKnown = entry.itadPrices !== undefined;
    const prevSrc = g.sources ?? {};

    g.sources = {
      itadId: itadKnown ? (itad?.id ?? null) : (prevSrc.itadId ?? null),
      igdbId: igdbKnown ? (match?.game.id ?? null) : (prevSrc.igdbId ?? null),
      igdbSlug: igdbKnown ? (match?.game.slug ?? null) : (prevSrc.igdbSlug ?? null),
      matchConfidence: igdbKnown
        ? (match?.confidence ?? "none")
        : (prevSrc.matchConfidence ?? "none"),
      fetchedAt: entry.fetchedAt ?? fetchedAt,
    };

    // ITAD aggregates PC storefronts only, and its lookup matches on title with
    // no year to verify against. On a console row that resolves to a different
    // product — "God of War" finds the 2018 PC reboot, not the 2005 PS2 game —
    // so console rows keep their authored msrp instead.
    if (g.store !== "pc") g.market = buildMarket(null);
    else if (pricesKnown) g.market = buildMarket(entry.itadPrices);
    else g.market ??= buildMarket(null);

    if (igdbKnown) g.igdb = buildIgdb(match, entry.igdbTtb);
    else g.igdb ??= buildIgdb(null, null);

    // Derived from the (possibly preserved) blocks above, never from `match`
    // directly, so a preserved block still reconciles its display fields.
    g.year =
      g.sources.matchConfidence === "exact" && g.igdb.releaseYear != null
        ? g.igdb.releaseYear
        : g.authored.year;
    g.hours = g.igdb.hoursMain != null ? Math.round(g.igdb.hoursMain) : g.authored.hours;
    // A regular price of 0 means the storefront listing is free-to-play, which
    // is not the same as "the story costs nothing" — Halo Infinite's Steam page
    // is the F2P multiplayer, while its campaign is a paid add-on. Writing
    // "$0.00" into a table about what it costs to play the story would be a lie,
    // so a zero regular never overwrites the authored msrp. The real figure is
    // still preserved in `market.regular` / `market.historicalLow`.
    const hasRealPrice = g.market.regular != null && g.market.regular > 0;
    g.msrp = hasRealPrice ? money(g.market.regular) : g.authored.msrp;

    const prev = before.get(g.id);
    for (const field of ["year", "hours", "msrp"]) {
      if (prev[field] !== g[field]) {
        changes.push({ id: g.id, title: g.title, field, from: prev[field], to: g[field] });
      }
    }
  }

  await writeFile(DATA, `${JSON.stringify(franchises, null, 2)}\n`);
  formatOutputs(DATA);

  // --- report ---
  const igdbCount = (c) => games.filter((g) => g.sources.matchConfidence === c).length;
  const itadMatched = games.filter((g) => g.sources.itadId).length;
  const priced = games.filter((g) => g.market.regular != null).length;
  const lows = games.filter((g) => g.market.historicalLow != null).length;
  const ttbCount = games.filter((g) => g.igdb.hoursMain != null).length;

  const md = [
    "# Enrichment report",
    "",
    `Data fetched up to: ${games
      .map((g) => g.sources.fetchedAt)
      .sort()
      .at(-1)}`,
    "",
    "## Match counts",
    "",
    "| Source | Result | Count |",
    "| --- | --- | --- |",
    `| IGDB | exact | ${igdbCount("exact")} |`,
    `| IGDB | fuzzy | ${igdbCount("fuzzy")} |`,
    `| IGDB | none | ${igdbCount("none")} |`,
    `| IGDB | time-to-beat available | ${ttbCount} |`,
    `| ITAD | matched | ${itadMatched} |`,
    `| ITAD | unmatched | ${games.length - itadMatched} |`,
    `| ITAD | regular price available | ${priced} |`,
    `| ITAD | historical low available | ${lows} |`,
    "",
    "## Unmatched games",
    "",
    ...(() => {
      const rows = games.filter((g) => g.sources.matchConfidence === "none" || !g.sources.itadId);
      if (!rows.length) return ["None."];
      return [
        "| Game | IGDB | ITAD |",
        "| --- | --- | --- |",
        ...rows.map(
          (g) =>
            `| ${g.title} | ${g.sources.matchConfidence} | ${g.sources.itadId ? "matched" : "none"} |`,
        ),
      ];
    })(),
    "",
    "## Changed display fields",
    "",
    ...(changes.length
      ? [
          "| Game | Field | Old | New |",
          "| --- | --- | --- | --- |",
          ...changes.map((c) => `| ${c.title} | ${c.field} | ${c.from} | ${c.to} |`),
        ]
      : ["No display fields changed on this run."]),
    "",
    "## API failures",
    "",
    ...(failures.length
      ? [
          "| Endpoint | Status | Detail |",
          "| --- | --- | --- |",
          ...failures.map((f) => `| ${f.endpoint} | ${f.status} | ${f.detail ?? ""} |`),
        ]
      : ["None."]),
    "",
  ].join("\n");
  await writeFile(REPORT, md);

  console.log(
    `\nIGDB exact ${igdbCount("exact")} / fuzzy ${igdbCount("fuzzy")} / none ${igdbCount("none")}`,
  );
  console.log(`ITAD matched ${itadMatched}/${games.length}, priced ${priced}, hist-low ${lows}`);
  console.log(`${changes.length} display-field changes, ${failures.length} API failures`);
  console.log(`report: ${REPORT}`);
}

await main();
