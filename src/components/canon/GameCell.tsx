"use client";

import type { Game } from "@/types/canon/canon";
import { cn } from "@/utils/cn";

interface GameCellProps {
  game: Game;
}

export default function GameCell({ game }: GameCellProps) {
  const title = (
    <>
      <span className="text-ink">{game.title}</span>
      {game.starter ? (
        <span className="ml-1.5 border border-edge px-1 text-[9px] text-muted uppercase tracking-[0.1em]">
          start
        </span>
      ) : null}
    </>
  );

  return (
    <div className="flex flex-col gap-0.5">
      {game.editions.length === 0 ? (
        <span className="pl-[13px]">{title}</span>
      ) : (
        <details className="group">
          <summary
            className={cn(
              "flex cursor-pointer list-none items-baseline gap-1",
              "[&::-webkit-details-marker]:hidden",
            )}
          >
            <span
              aria-hidden="true"
              className="text-[9px] text-faint transition-transform motion-reduce:transition-none group-open:rotate-90"
            >
              ▶
            </span>
            <span>{title}</span>
          </summary>

          <ul className="mt-1.5 ml-[13px] flex max-w-56 flex-col gap-1 border-edge border-l pl-2">
            {game.editions.map((edition) => (
              <li className="flex flex-col" key={`${edition.name}-${edition.year}`}>
                <span className={edition.recommended ? "text-ink" : "text-muted"}>
                  {edition.recommended ? "✓ " : "· "}
                  {edition.name}
                  <span className="text-faint"> · {edition.year}</span>
                </span>
                <span className="text-[11px] text-faint">
                  {edition.platforms} — {edition.note}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
