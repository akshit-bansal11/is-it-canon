import type { Entry, Franchise } from "@/types/canon/canon";
import type { ArcSection } from "@/types/canon/section";

/**
 * Splits rows into the franchise's declared storylines, preserving the order the
 * rows arrived in. A franchise without arcs — or a sort that no longer follows
 * chronology — collapses to one unlabelled section, so the caller never has to
 * branch on which case it got.
 */
export function groupArcs(entries: readonly Entry[], franchise: Franchise | null): ArcSection[] {
  const arcs = franchise?.arcs;
  if (arcs === undefined || arcs.length === 0) return [{ arc: null, entries: [...entries] }];

  const sections: ArcSection[] = arcs.map((arc) => ({
    arc,
    entries: entries.filter((entry) => entry.game.arc === arc.id),
  }));

  const known = new Set(arcs.map((arc) => arc.id));
  const loose = entries.filter(
    (entry) => entry.game.arc === undefined || !known.has(entry.game.arc),
  );
  if (loose.length > 0) sections.push({ arc: null, entries: loose });

  return sections.filter((section) => section.entries.length > 0);
}
