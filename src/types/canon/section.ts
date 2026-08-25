import type { Arc, Entry } from "@/types/canon/canon";

/** One storyline's worth of rows. `arc` is null for franchises that never split. */
export interface ArcSection {
  arc: Arc | null;
  entries: Entry[];
}
