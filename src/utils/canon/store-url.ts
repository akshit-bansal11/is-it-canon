import type { Game } from "@/types/canon/canon";

export function storeUrl(game: Game): string {
  const query = encodeURIComponent(game.query);
  if (game.store === "ps") return `https://store.playstation.com/en-us/search/${query}`;
  if (game.store === "xb") return `https://www.xbox.com/en-us/Search/Results?q=${query}`;
  if (game.store === "nin") return `https://www.nintendo.com/us/search/#q=${query}`;
  return `https://isthereanydeal.com/search/?q=${query}`;
}
