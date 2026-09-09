/** What a screen entry is, where the source says. Marvel's chronology never
 *  distinguishes film from series, so `null` means unknown rather than "other". */
export type ScreenType = "tv" | "movie" | "animated" | "special" | "ova";

/**
 * Chronologies interleave two kinds of row. A `title` is a thing you watch. A
 * `marker` places a run of episodes against the films around it — "AoS S1 Ep
 * 1–7 · Before Thor: The Dark World" — and carries the ordering's reasoning
 * rather than being watchable itself.
 */
export type ScreenEntryKind = "title" | "marker";

/** A named block within a chronology: a phase, an era, a saga. */
export interface ScreenGroup {
  id: string;
  name: string;
  blurb: string;
}

export interface ScreenEntry {
  id: string;
  order: number;
  /** Matches a `ScreenGroup.id`, or null where the chronology is one flat run. */
  group: string | null;
  kind: ScreenEntryKind;
  name: string;
  type: ScreenType | null;
  year: number | null;
  /** In-universe date where the source gives one, e.g. "132 BBY". */
  chronologicalYear: string | null;
  seasons: number | null;
  episodes: number | null;
  /** Source-specific continuity label, e.g. Marvel's "fox" / "sony" / "pre". */
  tag: string | null;
  note: string;
}

export interface ScreenFranchise {
  id: string;
  order: number;
  title: string;
  description: string;
  /** Which merge source this came from. Kept because the two disagree about
   *  scope — the MCU watch order is the Disney canon, the Marvel chronology
   *  spans studios — and a reader deserves to know which they are looking at. */
  source: string;
  groups: ScreenGroup[];
  entries: ScreenEntry[];
}

/** Landing-page counts, read from the database rather than hardcoded. */
export interface SectionCounts {
  franchises: number;
  entries: number;
}
