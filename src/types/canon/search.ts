export type HitKind = "franchise" | "game";

export interface SearchHit {
  kind: HitKind;
  id: string;
  franchiseId: string;
  label: string;
  sub: string;
}
