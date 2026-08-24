"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ThemeToggle from "@/components/canon/ThemeToggle";
import { CONTROL_CLASS } from "@/constants/canon/ui";
import type { PriceStatus } from "@/types/canon/price";
import { cn } from "@/utils/cn";

interface ToolbarActionsProps {
  shown: number;
  total: number;
  tracked: number;
  priceStatus: PriceStatus;
  priceMessage: string;
  filtersActive: boolean;
  onRefreshPrices: () => void;
  onCopyCsv: () => Promise<boolean>;
  onResetFilters: () => void;
  onClearEntries: () => void;
}

export default function ToolbarActions({
  shown,
  total,
  tracked,
  priceStatus,
  priceMessage,
  filtersActive,
  onRefreshPrices,
  onCopyCsv,
  onResetFilters,
  onClearEntries,
}: ToolbarActionsProps) {
  const [copied, setCopied] = useState(false);
  const [armed, setArmed] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(
    () => () => {
      for (const timer of timers.current) clearTimeout(timer);
      timers.current = [];
    },
    [],
  );

  const later = useCallback((run: () => void, ms: number) => {
    timers.current.push(setTimeout(run, ms));
  }, []);

  const copy = () => {
    void onCopyCsv().then((ok) => {
      setCopied(ok);
      later(() => setCopied(false), 1600);
    });
  };

  // Armed only counts while there is something to wipe, so the confirm state
  // can never strand on a button that has gone disabled underneath it.
  const showArmed = armed && tracked > 0;

  const clear = () => {
    if (!showArmed) {
      setArmed(true);
      later(() => setArmed(false), 3000);
      return;
    }
    setArmed(false);
    onClearEntries();
  };

  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <span className="px-1 text-[11px] text-faint tabular-nums whitespace-nowrap">
        {shown === total ? total : `${shown}/${total}`} rows · {tracked} tracked
      </span>

      <button
        className={cn(CONTROL_CLASS, "whitespace-nowrap")}
        disabled={priceStatus === "loading"}
        onClick={onRefreshPrices}
        type="button"
      >
        {priceStatus === "loading" ? "Fetching…" : "Update prices"}
      </button>

      {priceMessage === "" ? null : (
        <span
          className={cn(
            "max-w-64 truncate px-1 text-[11px]",
            priceStatus === "error" ? "text-ink" : "text-faint",
          )}
          title={priceMessage}
        >
          {priceMessage}
        </span>
      )}

      <button className={cn(CONTROL_CLASS, "whitespace-nowrap")} onClick={copy} type="button">
        {copied ? "Copied" : "Copy CSV"}
      </button>

      <button
        className={cn(CONTROL_CLASS, "whitespace-nowrap")}
        disabled={!filtersActive}
        onClick={onResetFilters}
        type="button"
      >
        Reset filters
      </button>

      <button
        className={cn(CONTROL_CLASS, "whitespace-nowrap")}
        disabled={tracked === 0}
        onClick={clear}
        type="button"
      >
        {showArmed ? "Confirm wipe" : "Clear tracking"}
      </button>

      <span aria-live="polite" className="sr-only">
        {showArmed ? "Clear tracking armed. Activate again to wipe every tracked game." : ""}
      </span>

      <ThemeToggle />
    </div>
  );
}
