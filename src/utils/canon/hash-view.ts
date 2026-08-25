import { ALL_FRANCHISES } from "@/constants/canon/views";
import type { ViewState } from "@/types/canon/view";

const EVERY_GAME = "all";

export const GRID_STATE: ViewState = {
  gridView: true,
  franchiseId: ALL_FRANCHISES,
  arcId: "",
};

/**
 * `#/`, `#/all`, `#/witcher`, `#/ac/desmond`. Reloading a 126-franchise app
 * back to the front door loses your place, and there is no way to send someone
 * a link to one series without it.
 */
export function formatHash(view: ViewState): string {
  if (view.gridView) return "#/";
  if (view.franchiseId === ALL_FRANCHISES) return `#/${EVERY_GAME}`;
  if (view.arcId === "") return `#/${view.franchiseId}`;
  return `#/${view.franchiseId}/${view.arcId}`;
}

/** Null when the hash says nothing about the view, so the caller keeps its default. */
export function parseHash(hash: string): ViewState | null {
  if (!hash.startsWith("#/")) return null;

  const [franchiseId = "", arcId = ""] = hash.slice(2).split("/");

  if (franchiseId === "") return GRID_STATE;
  if (franchiseId === EVERY_GAME) {
    return { gridView: false, franchiseId: ALL_FRANCHISES, arcId: "" };
  }
  return { gridView: false, franchiseId, arcId };
}
