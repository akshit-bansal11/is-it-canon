"use client";

import { Fragment } from "react";
import ArcSectionRow from "@/components/canon/ArcSectionRow";
import CanonRow from "@/components/canon/CanonRow";
import SortableHeader from "@/components/canon/SortableHeader";
import { COLUMNS, FRANCHISE_COLUMN } from "@/constants/canon/columns";
import { CHUNK_SIZE, STAGGER_LIMIT } from "@/constants/canon/motion";
import { CONTROL_CLASS } from "@/constants/canon/ui";
import { useChunked } from "@/hooks/canon/use-chunked";
import type { Entry, Franchise } from "@/types/canon/canon";
import type { PriceMap } from "@/types/canon/price";
import type { SortKey, SortState } from "@/types/canon/table";
import type { UserEntries, UserField } from "@/types/canon/user";
import { groupArcs } from "@/utils/canon/group-arcs";
import { cn } from "@/utils/cn";

interface CanonTableProps {
  entries: readonly Entry[];
  franchise: Franchise | null;
  sort: SortState;
  onSort: (key: SortKey) => void;
  userEntries: UserEntries;
  prices: PriceMap;
  focusGameId: string;
  onFieldChange: (gameId: string, field: UserField, value: string) => void;
  onOpenGame: (gameId: string) => void;
  onResetFilters: () => void;
}

export default function CanonTable({
  entries,
  franchise,
  sort,
  onSort,
  userEntries,
  prices,
  focusGameId,
  onFieldChange,
  onOpenGame,
  onResetFilters,
}: CanonTableProps) {
  const showFranchise = franchise === null;
  const columns = showFranchise ? [FRANCHISE_COLUMN, ...COLUMNS] : COLUMNS;
  const [visible, loading] = useChunked(entries, CHUNK_SIZE);

  // Storyline sections only make sense while the rows are still in story order.
  // Sort by price and the sections would interleave meaninglessly.
  const sections = groupArcs(visible, sort.key === "order" ? franchise : null);
  let printed = 0;

  return (
    <div className="h-full overflow-auto overscroll-contain">
      <table className="w-max min-w-full border-collapse text-left">
        <thead>
          <tr>
            {columns.map((column) => (
              <SortableHeader
                column={column}
                key={`${column.label}-${column.key ?? "static"}`}
                onSort={onSort}
                sort={sort}
              />
            ))}
          </tr>
        </thead>

        <tbody className="stagger">
          {entries.length === 0 ? (
            <tr>
              <td className="px-2 py-16 text-center" colSpan={columns.length}>
                <p className="text-[13px] text-muted">No game matches the current filters.</p>
                <button
                  className={cn(CONTROL_CLASS, "mt-3")}
                  onClick={onResetFilters}
                  type="button"
                >
                  Reset filters
                </button>
              </td>
            </tr>
          ) : (
            sections.map((section) => (
              <Fragment key={section.arc?.id ?? "loose"}>
                {section.arc === null ? null : (
                  <ArcSectionRow
                    arc={section.arc}
                    count={section.entries.length}
                    key={`arc-${section.arc.id}`}
                    span={columns.length}
                  />
                )}
                {section.entries.map((entry) => {
                  const index = Math.min(printed, STAGGER_LIMIT);
                  printed += 1;
                  return (
                    <CanonRow
                      entry={entry}
                      flash={entry.game.id === focusGameId}
                      index={index}
                      key={entry.game.id}
                      onFieldChange={onFieldChange}
                      onOpen={onOpenGame}
                      quote={prices[entry.game.id]}
                      showFranchise={showFranchise}
                      user={userEntries[entry.game.id]}
                    />
                  );
                })}
              </Fragment>
            ))
          )}

          {loading ? (
            <tr>
              <td className="px-2 py-3 text-center text-[11px] text-faint" colSpan={columns.length}>
                <span className="anim-pulse">Loading the rest…</span>
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
