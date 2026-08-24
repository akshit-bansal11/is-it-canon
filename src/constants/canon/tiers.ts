import type { Tier } from "@/types/canon/canon";

export const TIER_LABEL: Record<Tier, string> = {
  core: "Core",
  opt: "Optional",
  skip: "Skippable",
};

export const TIER_RANK: Record<Tier, number> = {
  core: 0,
  opt: 1,
  skip: 2,
};

export const TIER_OPTIONS = [
  { id: "core", label: "Core" },
  { id: "opt", label: "Optional" },
  { id: "skip", label: "Skippable" },
] as const;
