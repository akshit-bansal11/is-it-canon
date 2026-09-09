import { CELL_CLASS, NUM_CLASS } from "@/constants/canon/ui";
import type { ScreenEntry, ScreenFranchise, ScreenGroup } from "@/types/canon/screen";
import { cn } from "@/utils/cn";

const TYPE_LABEL: Record<string, string> = {
  tv: "series",
  movie: "film",
  animated: "animated",
  special: "special",
  ova: "ova",
};

function Meta({ entry }: { entry: ScreenEntry }) {
  const bits: string[] = [];
  if (entry.type !== null) bits.push(TYPE_LABEL[entry.type] ?? entry.type);
  if (entry.year !== null) bits.push(String(entry.year));
  if (entry.chronologicalYear !== null) bits.push(entry.chronologicalYear);
  if (entry.seasons !== null) bits.push(`${entry.seasons} seasons`);
  if (entry.episodes !== null) bits.push(`${entry.episodes} ep`);
  if (entry.tag !== null) bits.push(entry.tag);

  if (bits.length === 0) return null;

  return (
    <span className={cn(NUM_CLASS, "flex flex-wrap items-center gap-x-2 text-[10px] text-faint")}>
      {bits.map((bit, index) => (
        <span className="flex items-center gap-2" key={bit}>
          {index > 0 ? <span aria-hidden="true">·</span> : null}
          <span>{bit}</span>
        </span>
      ))}
    </span>
  );
}

function Row({ entry, position }: { entry: ScreenEntry; position: number }) {
  // A marker is not a thing to watch — it explains where a run of episodes sits
  // against the films around it. Rendering it as another numbered title would
  // claim it is watchable and throw the count off.
  if (entry.kind === "marker") {
    return (
      <li className="flex gap-3 border-line border-b py-2 pl-2">
        <span aria-hidden="true" className={cn(NUM_CLASS, "w-8 shrink-0 text-[10px] text-faint")}>
          ↳
        </span>
        <span className="text-[11px] text-faint italic leading-relaxed">{entry.name}</span>
      </li>
    );
  }

  return (
    <li className={cn(CELL_CLASS, "flex gap-3 pl-2")}>
      <span className={cn(NUM_CLASS, "w-8 shrink-0 pt-[2px] text-[10px] text-faint")}>
        {position}
      </span>
      <span className="flex flex-1 flex-col gap-1">
        <span className="text-[13px] text-ink leading-tight">{entry.name}</span>
        <Meta entry={entry} />
        {entry.note === "" ? null : (
          <span className="text-[11px] text-muted leading-relaxed">{entry.note}</span>
        )}
      </span>
    </li>
  );
}

interface ScreenTimelineProps {
  franchise: ScreenFranchise;
}

export default function ScreenTimeline({ franchise }: ScreenTimelineProps) {
  const ordered = [...franchise.entries].sort((left, right) => left.order - right.order);

  // Ungrouped chronologies (the MCU watch order is one flat run) get a single
  // nameless block rather than a special-cased branch further down.
  const blocks: { group: ScreenGroup | null; entries: ScreenEntry[] }[] = [];
  for (const entry of ordered) {
    const group = franchise.groups.find((item) => item.id === entry.group) ?? null;
    const last = blocks.at(-1);
    if (last !== undefined && last.group?.id === group?.id) last.entries.push(entry);
    else blocks.push({ group, entries: [entry] });
  }

  let position = 0;

  return (
    <div className="flex flex-col gap-7">
      {blocks.map((block) => (
        <section className="flex flex-col gap-2" key={block.group?.id ?? "ungrouped"}>
          {block.group === null ? null : (
            <header className="flex flex-col gap-1">
              <h2 className="font-medium text-[13px] text-ink tracking-[-0.01em]">
                {block.group.name}
              </h2>
              {block.group.blurb === "" ? null : (
                <p className="max-w-prose text-[11px] text-muted leading-relaxed">
                  {block.group.blurb}
                </p>
              )}
            </header>
          )}
          <ol className="m-0 flex list-none flex-col p-0">
            {block.entries.map((entry) => {
              if (entry.kind === "title") position += 1;
              return <Row entry={entry} key={entry.id} position={position} />;
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
