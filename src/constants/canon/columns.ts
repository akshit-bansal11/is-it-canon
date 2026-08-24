import type { Column } from "@/types/canon/table";

export const FRANCHISE_COLUMN: Column = {
  key: "franchise",
  label: "Series",
  className: "w-28",
};

export const COLUMNS: readonly Column[] = [
  { key: "order", label: "#", className: "w-9 text-right" },
  { key: "title", label: "Game", className: "min-w-60", sticky: true },
  { key: "status", label: "Status", className: "w-32", userField: true },
  { key: null, label: "Device", className: "w-30", userField: true },
  { key: null, label: "Store", className: "w-34", userField: true },
  { key: "year", label: "Year", className: "w-14 text-right" },
  { key: "version", label: "Best version", className: "w-52" },
  { key: "platform", label: "Runs on", className: "w-28" },
  { key: "msrp", label: "MSRP", className: "w-20 text-right" },
  { key: "now", label: "Now", className: "w-28 text-right" },
  { key: "hours", label: "Hrs", className: "w-12 text-right" },
  { key: "tier", label: "Skip?", className: "w-20" },
  { key: null, label: "Notes", className: "min-w-[24rem]" },
];
