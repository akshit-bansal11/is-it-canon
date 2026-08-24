"use client";

import type { Franchise } from "@/types/canon/canon";
import { cn } from "@/utils/cn";

interface FranchiseTabsProps {
  franchises: readonly Franchise[];
  activeId: string;
  totalCount: number;
  countFor: (franchiseId: string) => number;
  onSelect: (franchiseId: string) => void;
}

export default function FranchiseTabs({
  franchises,
  activeId,
  totalCount,
  countFor,
  onSelect,
}: FranchiseTabsProps) {
  const tab = (id: string, label: string, count: number) => (
    <button
      aria-pressed={activeId === id}
      className={cn(
        "flex shrink-0 items-baseline gap-1.5 border-b-2 px-3 py-2.5 whitespace-nowrap sm:py-2 transition-colors motion-reduce:transition-none",
        activeId === id
          ? "border-ink text-ink"
          : "border-transparent text-faint hover:border-edge hover:text-muted",
      )}
      key={id}
      onClick={() => onSelect(id)}
      type="button"
    >
      {label}
      <span className="text-[10px] tabular-nums">{count}</span>
    </button>
  );

  return (
    <nav
      aria-label="Franchises"
      className="flex shrink-0 overflow-x-auto border-line border-b text-[12px]"
    >
      {tab("", "All", totalCount)}
      {franchises.map((franchise) => tab(franchise.id, franchise.name, countFor(franchise.id)))}
    </nav>
  );
}
