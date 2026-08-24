"use client";

import CanonRow from "@/components/canon/CanonRow";
import SortableHeader from "@/components/canon/SortableHeader";
import { COLUMNS, FRANCHISE_COLUMN } from "@/constants/canon/columns";
import type { Entry, Franchise } from "@/types/canon/canon";
import type { PriceMap } from "@/types/canon/price";
import type { SortKey, SortState } from "@/types/canon/table";
import type { UserEntries, UserField } from "@/types/canon/user";

interface CanonTableProps {
  entries: readonly Entry[];
  franchise: Franchise | null;
  sort: SortState;
  onSort: (key: SortKey) => void;
  userEntries: UserEntries;
  prices: PriceMap;
  onFieldChange: (gameId: string, field: UserField, value: string) => void;
}

export default function CanonTable({
  entries,
  franchise,
  sort,
  onSort,
  userEntries,
  prices,
  onFieldChange,
}: CanonTableProps) {
  const showFranchise = franchise === null;
  const columns = showFranchise ? [FRANCHISE_COLUMN, ...COLUMNS] : COLUMNS;

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

        <tbody>
          {franchise === null ? null : (
            <tr>
              <td
                className="border-line border-b px-2 py-2 text-[11px] text-faint leading-relaxed"
                colSpan={columns.length}
              >
                <span className="text-muted">{franchise.scope}</span> {franchise.caveat}
              </td>
            </tr>
          )}

          {entries.length === 0 ? (
            <tr>
              <td className="px-2 py-6 text-center text-faint" colSpan={columns.length}>
                No rows match the current filters.
              </td>
            </tr>
          ) : (
            entries.map((entry) => (
              <CanonRow
                entry={entry}
                key={entry.game.id}
                onFieldChange={onFieldChange}
                quote={prices[entry.game.id]}
                showFranchise={showFranchise}
                user={userEntries[entry.game.id]}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
