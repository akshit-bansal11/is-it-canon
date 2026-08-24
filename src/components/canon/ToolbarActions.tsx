"use client";

import { useState } from "react";
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

  const copy = () => {
    void onCopyCsv().then((ok) => {
      setCopied(ok);
      setTimeout(() => setCopied(false), 1600);
    });
  };

  const clear = () => {
    if (!armed) {
      setArmed(true);
      setTimeout(() => setArmed(false), 3000);
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
        {armed ? "Confirm wipe" : "Clear tracking"}
      </button>

      <ThemeToggle />
    </div>
  );
}
