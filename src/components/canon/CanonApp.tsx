"use client";

import { useCallback, useMemo, useState } from "react";
import CanonTable from "@/components/canon/CanonTable";
import FilterControls from "@/components/canon/FilterControls";
import FranchiseTabs from "@/components/canon/FranchiseTabs";
import ToolbarActions from "@/components/canon/ToolbarActions";
import { EMPTY_FILTER } from "@/constants/canon/filters";
import { ALL_ENTRIES, FRANCHISES } from "@/data/franchises";
import { useEntries } from "@/hooks/canon/use-entries";
import { usePrices } from "@/hooks/canon/use-prices";
import type { FilterState, SortKey, SortState } from "@/types/canon/table";
import { filterEntries } from "@/utils/canon/filter-entries";
import { sortEntries } from "@/utils/canon/sort-entries";
import { toCsv } from "@/utils/canon/to-csv";

const PRICE_BATCH = 60;

export default function CanonApp() {
  const [activeId, setActiveId] = useState("");
  const [sort, setSort] = useState<SortState>({ key: "franchise", direction: 1 });
  const [filter, setFilter] = useState<FilterState>(EMPTY_FILTER);

  const { entries: userEntries, setField, clearEntries } = useEntries();
  const { prices, status: priceStatus, message: priceMessage, refresh } = usePrices();

  const franchise = useMemo(
    () => FRANCHISES.find((item) => item.id === activeId) ?? null,
    [activeId],
  );

  const scoped = useMemo(
    () => (franchise === null ? ALL_ENTRIES : franchise.games.map((game) => ({ game, franchise }))),
    [franchise],
  );

  const rows = useMemo(
    () => sortEntries(filterEntries(scoped, filter, userEntries), sort, { userEntries, prices }),
    [scoped, filter, userEntries, sort, prices],
  );

  const onSort = useCallback((key: SortKey) => {
    setSort((current) =>
      current.key === key
        ? { key, direction: current.direction === 1 ? -1 : 1 }
        : { key, direction: 1 },
    );
  }, []);

  const onSelectFranchise = useCallback((id: string) => {
    setActiveId(id);
    setSort({ key: id === "" ? "franchise" : "order", direction: 1 });
  }, []);

  const onFilterChange = useCallback((patch: Partial<FilterState>) => {
    setFilter((current) => ({ ...current, ...patch }));
  }, []);

  const onCopyCsv = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(toCsv(rows, userEntries, prices));
      return true;
    } catch (error) {
      console.warn("clipboard write failed", error);
      return false;
    }
  }, [rows, userEntries, prices]);

  const onRefreshPrices = useCallback(() => {
    refresh(rows.slice(0, PRICE_BATCH).map((entry) => entry.game));
  }, [refresh, rows]);

  const filtersActive = useMemo(
    () => Object.values(filter).some((value) => value !== ""),
    [filter],
  );

  return (
    <div className="flex h-dvh flex-col">
      <FranchiseTabs
        activeId={activeId}
        countFor={(id) => FRANCHISES.find((item) => item.id === id)?.games.length ?? 0}
        franchises={FRANCHISES}
        onSelect={onSelectFranchise}
        totalCount={ALL_ENTRIES.length}
      />

      <div className="flex shrink-0 items-center gap-3 overflow-x-auto border-line border-b px-2 py-2">
        <FilterControls filter={filter} onChange={onFilterChange} />
        <ToolbarActions
          filtersActive={filtersActive}
          onClearEntries={clearEntries}
          onCopyCsv={onCopyCsv}
          onRefreshPrices={onRefreshPrices}
          onResetFilters={() => setFilter(EMPTY_FILTER)}
          priceMessage={priceMessage}
          priceStatus={priceStatus}
          shown={rows.length}
          total={scoped.length}
          tracked={Object.keys(userEntries).length}
        />
      </div>

      <div className="min-h-0 flex-1">
        <CanonTable
          entries={rows}
          franchise={franchise}
          onFieldChange={setField}
          onSort={onSort}
          prices={prices}
          sort={sort}
          userEntries={userEntries}
        />
      </div>
    </div>
  );
}
