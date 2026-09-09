#!/usr/bin/env node
// Audits src/data/franchises.json against IGDB and reports three things the
// enrichment run cannot: rows IGDB has never heard of (a title that does not
// exist is the failure mode of hand-authored data), rows whose year is wrong
// enough that enrichment refused the match, and games IGDB lists in the same
// series that the dataset is missing.
//
// Usage: node --env-file=.env.local scripts/audit-coverage.mjs
//
// Phase A reads the enrichment cache and makes no API calls at all.
// Phase B queries IGDB collections and needs credentials.

import { readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const DATA = join(HERE, "..", "src", "data", "franchises.json");
const CACHE = join(HERE, ".cache");
const REPORT = join(HERE, "audit-report.md");

const { IGDB_CLIENT_ID, IGDB_CLIENT_SECRET } = process.env;

/** Anything released this year or later is too new to judge from a static list. */
const RECENT_FROM = 2023;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const norm = (s) =>
  s
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/** IGDB game_type: 0 main game, 8 remake, 9 remaster, 10 expanded, 11 port. */
const MAIN_GAME = 0;

async function call(url, init = {}) {
  for (let attempt = 0; attempt < 4; attempt++) {
    if (attempt > 0) await sleep(1000 * 2 ** attempt);
    const res = await fetch(url, init).catch(() => null);
    if (res?.ok) return res.json();
    if (res && res.status !== 429 && res.status < 500) return null;
  }
  return null;
}

async function igdbToken() {
  if (!IGDB_CLIENT_ID || !IGDB_CLIENT_SECRET) return null;
  const json = await call(
    `https://id.twitch.tv/oauth2/token?client_id=${IGDB_CLIENT_ID}&client_secret=${IGDB_CLIENT_SECRET}&grant_type=client_credentials`,
    { method: "POST" },
  );
  return json?.access_token ?? null;
}

function igdbPost(token, path, body) {
  return call(`https://api.igdb.com/v4/${path}`, {
    method: "POST",
    headers: {
      "Client-ID": IGDB_CLIENT_ID,
      Authorization: `Bearer ${token}`,
      "Content-Type": "text/plain",
    },
    body,
  });
}

async function loadCache() {
  const map = new Map();
  for (const file of await readdir(CACHE).catch(() => [])) {
    if (!file.endsWith(".json")) continue;
    map.set(file.slice(0, -5), JSON.parse(await readFile(join(CACHE, file), "utf8")));
  }
  return map;
}

const cacheKey = (id) => id.replace(/[^a-z0-9-]/gi, "_");

const yearOf = (candidate) =>
  candidate.first_release_date
    ? new Date(candidate.first_release_date * 1000).getUTCFullYear()
    : null;

/**
 * Phase A. The enrichment cache holds IGDB's top 50 title matches for every
 * row, so both questions below are answerable without a single new request:
 * an exact-title hit anywhere in that list means the game is real, and its
 * release year is what IGDB says regardless of what the row claims.
 */
function auditRow(game, entry) {
  if (entry?.igdbSearch === undefined) return { verdict: "not-looked-up" };

  const exact = entry.igdbSearch.filter((c) => norm(c.name) === norm(game.title));
  if (exact.length === 0) return { verdict: "no-igdb-record" };

  const years = exact.map(yearOf).filter((y) => y !== null);
  if (years.length === 0) return { verdict: "no-release-date" };

  const closest = years.reduce((best, y) =>
    Math.abs(y - game.year) < Math.abs(best - game.year) ? y : best,
  );
  const drift = Math.abs(closest - game.year);
  if (drift === 0) return { verdict: "ok", igdbYear: closest };
  return { verdict: drift > 1 ? "year-wrong" : "year-close", igdbYear: closest, drift };
}

async function main() {
  const franchises = JSON.parse(await readFile(DATA, "utf8"));
  const cache = await loadCache();

  const rows = [];
  for (const franchise of franchises) {
    for (const game of franchise.games) {
      rows.push({ franchise, game, ...auditRow(game, cache.get(cacheKey(game.id))) });
    }
  }

  const known = new Set(rows.map((row) => norm(row.game.title)));

  // --- Phase B: what IGDB lists in the same series that we do not have ---
  const token = await igdbToken();
  const missing = [];

  if (token) {
    // Collection ids come from the games we already matched, so a series is
    // only swept when at least one of its rows resolved to a real IGDB record.
    const matchedIds = rows
      .map((row) => row.game.sources?.igdbId)
      .filter((id) => typeof id === "number");

    const collectionOf = new Map();
    for (let i = 0; i < matchedIds.length; i += 100) {
      const chunk = matchedIds.slice(i, i + 100);
      const res = await igdbPost(
        token,
        "games",
        `fields id,collections; where id = (${chunk.join(",")}); limit 500;`,
      );
      await sleep(280);
      for (const row of res ?? []) collectionOf.set(row.id, row.collections ?? []);
    }

    for (const franchise of franchises) {
      const ids = new Set();
      for (const game of franchise.games) {
        for (const c of collectionOf.get(game.sources?.igdbId) ?? []) ids.add(c);
      }
      if (ids.size === 0) continue;

      const res = await igdbPost(
        token,
        "games",
        `fields name,first_release_date,game_type; where collections = (${[...ids].join(",")}) & game_type = ${MAIN_GAME} & first_release_date != null; limit 500;`,
      );
      await sleep(280);

      for (const candidate of res ?? []) {
        const year = yearOf(candidate);
        if (year === null || year < RECENT_FROM) continue;
        if (known.has(norm(candidate.name))) continue;
        missing.push({ franchise: franchise.name, title: candidate.name, year });
      }
    }
  }

  // ------------------------------------------------------------- report ---
  const by = (verdict) => rows.filter((row) => row.verdict === verdict);
  const table = (list, cols, cells) => [
    `| ${cols.join(" | ")} |`,
    `| ${cols.map(() => "---").join(" | ")} |`,
    ...list.map((item) => `| ${cells(item).join(" | ")} |`),
  ];

  const section = (title, list, cols, cells, empty) => [
    `## ${title}`,
    "",
    ...(list.length === 0 ? [empty] : table(list, cols, cells)),
    "",
  ];

  const md = [
    "# Coverage audit",
    "",
    `${rows.length} rows across ${franchises.length} franchises.`,
    "",
    "| Verdict | Rows |",
    "| --- | --- |",
    ...["ok", "year-close", "year-wrong", "no-igdb-record", "no-release-date", "not-looked-up"].map(
      (verdict) => `| ${verdict} | ${by(verdict).length} |`,
    ),
    "",
    ...section(
      "No IGDB record under this exact title",
      by("no-igdb-record"),
      ["Franchise", "Title", "Claimed year"],
      (row) => [row.franchise.name, row.game.title, row.game.year],
      "None — every title matched an IGDB record.",
    ),
    ...section(
      "Year disagrees with IGDB by more than one",
      by("year-wrong"),
      ["Franchise", "Title", "Ours", "IGDB"],
      (row) => [row.franchise.name, row.game.title, row.game.year, row.igdbYear],
      "None.",
    ),
    ...section(
      `Games IGDB lists in these series from ${RECENT_FROM} on that the dataset does not have`,
      missing.sort((a, b) => b.year - a.year || a.franchise.localeCompare(b.franchise)),
      ["Franchise", "Title", "Released"],
      (item) => [item.franchise, item.title, item.year],
      token === null ? "Skipped — no IGDB credentials." : "None.",
    ),
  ].join("\n");

  await writeFile(REPORT, `${md}\n`);

  for (const verdict of ["no-igdb-record", "year-wrong", "not-looked-up"]) {
    console.log(`${verdict}: ${by(verdict).length}`);
  }
  console.log(`missing recent entries: ${missing.length}`);
  console.log(`report: ${REPORT}`);
}

await main();
