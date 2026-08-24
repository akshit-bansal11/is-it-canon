import type { DEVICES } from "@/constants/canon/devices";
import type { STOREFRONTS } from "@/constants/canon/storefronts";

export type Status = "completed" | "playing" | "backlogged" | "dropped" | "wishlist" | "trash";

export type Device = (typeof DEVICES)[number]["id"];

export type Storefront = (typeof STOREFRONTS)[number]["id"];

export interface UserEntry {
  status?: Status;
  device?: Device;
  storefront?: Storefront;
}

export type UserEntries = Record<string, UserEntry>;

export type UserField = keyof UserEntry;

export interface Option {
  id: string;
  label: string;
}
