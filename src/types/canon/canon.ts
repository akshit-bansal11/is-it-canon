export type Tier = "core" | "opt" | "skip";

export type StoreKind = "pc" | "ps" | "xb";

export interface Edition {
  name: string;
  year: number;
  platforms: string;
  recommended: boolean;
  note: string;
}

export type MatchConfidence = "exact" | "fuzzy" | "none";

/** Provenance for the API-enriched fields below. */
export interface GameSources {
  itadId: string | null;
  igdbId: number | null;
  igdbSlug: string | null;
  matchConfidence: MatchConfidence;
  fetchedAt: string;
}

/** Live pricing from IsThereAnyDeal (US region). */
export interface GameMarket {
  regular: number | null;
  best: number | null;
  shop: string | null;
  cut: number | null;
  historicalLow: number | null;
  url: string | null;
}

/** Catalogue facts from IGDB. */
export interface GameIgdb {
  releaseYear: number | null;
  platforms: string[];
  rating: number | null;
  ratingCount: number | null;
  genres: string[];
  hoursMain: number | null;
  hoursComplete: number | null;
}

/** Hand-authored values, kept so enrichment re-runs stay comparable. */
export interface GameAuthored {
  year: number;
  hours: number | null;
  msrp: string;
  version: string;
}

export interface Game {
  id: string;
  order: number;
  title: string;
  year: number;
  version: string;
  platform: string;
  msrp: string;
  hours: number | null;
  tier: Tier;
  starter: boolean;
  store: StoreKind;
  query: string;
  storefront: string;
  note: string;
  editions: Edition[];
  sources?: GameSources;
  market?: GameMarket;
  igdb?: GameIgdb;
  authored?: GameAuthored;
}

export interface Franchise {
  id: string;
  name: string;
  scope: string;
  caveat: string;
  games: Game[];
}

export interface Entry {
  game: Game;
  franchise: Franchise;
}
