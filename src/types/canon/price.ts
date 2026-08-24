export interface PriceQuote {
  amount: number;
  currency: string;
  shop: string;
  cut: number;
  url: string;
}

export type PriceMap = Record<string, PriceQuote>;

export type PriceStatus = "idle" | "loading" | "ready" | "error";
