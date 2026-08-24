"use client";

import GameCell from "@/components/canon/GameCell";
import OptionSelect from "@/components/canon/OptionSelect";
import PriceCell from "@/components/canon/PriceCell";
import { FIELD_LABEL, STATUSES } from "@/constants/canon/statuses";
import { TIER_LABEL } from "@/constants/canon/tiers";
import { CELL_CLASS } from "@/constants/canon/ui";
import type { Entry } from "@/types/canon/canon";
import type { PriceQuote } from "@/types/canon/price";
import type { UserEntry, UserField } from "@/types/canon/user";
import { optionsFor } from "@/utils/canon/entry-options";
import { cn } from "@/utils/cn";

interface CanonRowProps {
  entry: Entry;
  user: UserEntry | undefined;
  quote: PriceQuote | undefined;
  showFranchise: boolean;
  onFieldChange: (gameId: string, field: UserField, value: string) => void;
}

export default function CanonRow({
  entry,
  user,
  quote,
  showFranchise,
  onFieldChange,
}: CanonRowProps) {
  const { game } = entry;
  const tracked = user?.status !== undefined;

  const userSelect = (field: UserField, placeholder: string) => (
    <OptionSelect
      className="w-full"
      label={`${FIELD_LABEL[field]} — ${game.title}`}
      onChange={(value) => onFieldChange(game.id, field, value)}
      options={field === "status" ? STATUSES : optionsFor(field)}
      placeholder={placeholder}
      value={user?.[field] ?? ""}
    />
  );

  return (
    <tr className="group hover:bg-surface">
      {showFranchise ? (
        <td className={cn(CELL_CLASS, "text-[11px] text-faint")}>{entry.franchise.name}</td>
      ) : null}

      <td className={cn(CELL_CLASS, "text-right text-faint tabular-nums")}>{game.order}</td>

      <td
        className={cn(
          CELL_CLASS,
          "sticky left-0 z-10 bg-canvas group-hover:bg-surface",
          "border-edge border-r",
        )}
      >
        <GameCell game={game} />
      </td>

      <td className={CELL_CLASS}>{userSelect("status", "—")}</td>
      <td className={CELL_CLASS}>
        {tracked ? userSelect("device", "—") : <span className="pl-2 text-faint">·</span>}
      </td>
      <td className={CELL_CLASS}>
        {tracked ? userSelect("storefront", "—") : <span className="pl-2 text-faint">·</span>}
      </td>

      <td className={cn(CELL_CLASS, "text-right text-muted tabular-nums")}>{game.year}</td>
      <td className={cn(CELL_CLASS, "text-muted")}>{game.version}</td>
      <td className={cn(CELL_CLASS, "text-muted")}>{game.platform}</td>
      <td className={cn(CELL_CLASS, "text-right text-muted tabular-nums")}>{game.msrp}</td>
      <td className={cn(CELL_CLASS, "text-right tabular-nums")}>
        <PriceCell game={game} quote={quote} />
      </td>
      <td className={cn(CELL_CLASS, "text-right text-muted tabular-nums")}>{game.hours ?? "—"}</td>
      <td className={cn(CELL_CLASS, "text-muted")}>{TIER_LABEL[game.tier]}</td>
      <td className={cn(CELL_CLASS, "text-[12px] text-muted leading-relaxed")}>{game.note}</td>
    </tr>
  );
}
