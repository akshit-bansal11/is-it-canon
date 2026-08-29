import type { Status } from "@/types/canon/user";

export const STATUSES = [
  { id: "playing", label: "Playing" },
  { id: "completed", label: "Completed" },
  { id: "own", label: "Own" },
  { id: "backlogged", label: "Backlogged" },
  { id: "wishlist", label: "Wishlist" },
  { id: "dropped", label: "Dropped" },
  { id: "trash", label: "Trash" },
] as const satisfies readonly { id: Status; label: string }[];

export const STATUS_LABEL: Record<Status, string> = {
  playing: "Playing",
  completed: "Completed",
  own: "Own",
  backlogged: "Backlogged",
  wishlist: "Wishlist",
  dropped: "Dropped",
  trash: "Trash",
};

export const UNSET_LABEL = "—";

export const FIELD_LABEL = {
  status: "Status",
  device: "Device",
  storefront: "Store",
} as const;
