export type SortKey =
  | "order"
  | "franchise"
  | "title"
  | "status"
  | "year"
  | "version"
  | "platform"
  | "msrp"
  | "now"
  | "hours"
  | "tier";

export type SortDirection = 1 | -1;

export interface SortState {
  key: SortKey;
  direction: SortDirection;
}

export interface Column {
  key: SortKey | null;
  label: string;
  className: string;
  sticky?: boolean;
  userField?: boolean;
}

export interface FilterState {
  query: string;
  status: string;
  tier: string;
  device: string;
  storefront: string;
  platform: string;
}
