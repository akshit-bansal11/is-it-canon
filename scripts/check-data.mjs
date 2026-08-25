// Structural checks over src/data/franchises.json that the type system cannot
// make: uniqueness, ordering, and whether the storyline arcs actually line up
// with the games that claim them. Run by `npm run data:check`.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const DATA = fileURLToPath(new URL("../src/data/franchises.json", import.meta.url));

const TIERS = new Set(["core", "opt", "skip"]);
const STORES = new Set(["pc", "ps", "xb", "nin"]);

const REQUIRED_STRINGS = [
  "id",
  "title",
  "version",
  "platform",
  "msrp",
  "query",
  "storefront",
  "note",
];

function checkGame(game, franchise, seenIds, index, problems) {
  const where = `${franchise.id} #${index + 1}`;

  for (const field of REQUIRED_STRINGS) {
    if (typeof game[field] !== "string" || game[field] === "") {
      problems.push(`${where}: "${field}" must be a non-empty string`);
    }
  }

  if (seenIds.has(game.id)) problems.push(`${where}: duplicate game id "${game.id}"`);
  seenIds.add(game.id);

  if (game.order !== index + 1) {
    problems.push(`${where} (${game.id}): order is ${game.order}, expected ${index + 1}`);
  }
  if (!Number.isInteger(game.year)) problems.push(`${where}: year must be a whole number`);
  if (game.hours !== null && typeof game.hours !== "number") {
    problems.push(`${where}: hours must be a number or null`);
  }
  if (!TIERS.has(game.tier)) problems.push(`${where}: unknown tier "${game.tier}"`);
  if (!STORES.has(game.store)) problems.push(`${where}: unknown store "${game.store}"`);
  if (typeof game.starter !== "boolean") problems.push(`${where}: starter must be a boolean`);

  if (!Array.isArray(game.editions)) {
    problems.push(`${where}: editions must be an array`);
    return;
  }
  if (game.editions.length > 0) {
    const picked = game.editions.filter((edition) => edition.recommended === true).length;
    if (picked !== 1) {
      problems.push(`${where}: ${picked} recommended editions, expected exactly 1`);
    }
  }
}

function checkArcs(franchise, problems) {
  const arcs = franchise.arcs;
  if (arcs === undefined) {
    const stray = franchise.games.filter((game) => game.arc !== undefined);
    if (stray.length > 0) {
      problems.push(`${franchise.id}: games name an arc but the franchise declares none`);
    }
    return;
  }

  const ids = arcs.map((arc) => arc.id);
  if (new Set(ids).size !== ids.length) problems.push(`${franchise.id}: duplicate arc ids`);

  const known = new Set(ids);
  const sequence = [];

  for (const game of franchise.games) {
    if (game.arc === undefined) {
      problems.push(`${franchise.id}: "${game.id}" has no arc, but the franchise declares arcs`);
      continue;
    }
    if (!known.has(game.arc)) {
      problems.push(`${franchise.id}: "${game.id}" names unknown arc "${game.arc}"`);
      continue;
    }
    if (sequence.at(-1) !== game.arc) sequence.push(game.arc);
  }

  if (new Set(sequence).size !== sequence.length) {
    problems.push(
      `${franchise.id}: arc "${sequence.find((id, at) => sequence.indexOf(id) !== at)}" is split into non-adjacent blocks`,
    );
  }
}

function main() {
  const franchises = JSON.parse(readFileSync(DATA, "utf8"));
  const problems = [];
  const franchiseIds = new Set();
  const gameIds = new Set();
  let games = 0;
  let arcs = 0;

  for (const franchise of franchises) {
    if (franchiseIds.has(franchise.id)) problems.push(`duplicate franchise id "${franchise.id}"`);
    franchiseIds.add(franchise.id);

    if (franchise.games.length < 2) {
      problems.push(`${franchise.id}: needs at least 2 games to be a storyline`);
    }

    for (const [index, game] of franchise.games.entries()) {
      checkGame(game, franchise, gameIds, index, problems);
    }
    checkArcs(franchise, problems);

    games += franchise.games.length;
    arcs += franchise.arcs?.length ?? 0;
  }

  if (problems.length > 0) {
    console.error(`${problems.length} problems:`);
    for (const problem of problems) console.error(`  ${problem}`);
    process.exit(1);
  }

  console.log(`${franchises.length} franchises · ${games} games · ${arcs} storylines · clean`);
}

main();
