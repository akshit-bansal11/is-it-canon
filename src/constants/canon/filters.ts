import { STATUSES } from "@/constants/canon/statuses";
import type { FilterState } from "@/types/canon/table";
import type { Option } from "@/types/canon/user";

export const PLATFORM_FILTERS = [
  { id: "pc", label: "PC", match: "PC" },
  { id: "ps", label: "PlayStation", match: "PS" },
  { id: "xb", label: "Xbox", match: "Xbox" },
] as const;

export const UNSET_FILTER = "none";

export const STATUS_FILTER_OPTIONS: readonly Option[] = [
  { id: UNSET_FILTER, label: "Untracked" },
  ...STATUSES,
];

export const EMPTY_FILTER: FilterState = {
  query: "",
  status: "",
  tier: "",
  device: "",
  storefront: "",
  platform: "",
};
