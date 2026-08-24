export type Tier = "core" | "opt" | "skip";

export type StoreKind = "pc" | "ps" | "xb";

export interface Edition {
  name: string;
  year: number;
  platforms: string;
  recommended: boolean;
  note: string;
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
