import { DEVICES } from "@/constants/canon/devices";
import { STATUSES } from "@/constants/canon/statuses";
import { STOREFRONTS } from "@/constants/canon/storefronts";
import type { Option, UserField } from "@/types/canon/user";

const BY_FIELD: Record<UserField, readonly Option[]> = {
  status: STATUSES,
  device: DEVICES,
  storefront: STOREFRONTS,
};

export function optionsFor(field: UserField): readonly Option[] {
  return BY_FIELD[field];
}

export function labelFor(field: UserField, id: string | undefined): string {
  if (id === undefined) return "";
  return BY_FIELD[field].find((option) => option.id === id)?.label ?? id;
}

export function isValidOption(field: UserField, id: unknown): id is string {
  return typeof id === "string" && BY_FIELD[field].some((option) => option.id === id);
}
