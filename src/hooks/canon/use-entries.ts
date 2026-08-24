"use client";

import { useSyncExternalStore } from "react";
import type { UserEntries, UserField } from "@/types/canon/user";
import {
  clearAllEntries,
  getEntriesSnapshot,
  getServerEntriesSnapshot,
  setEntryField,
  subscribeEntries,
} from "@/utils/canon/entries-store";

export interface UseEntries {
  entries: UserEntries;
  setField: (gameId: string, field: UserField, value: string) => void;
  clearEntries: () => void;
}

export function useEntries(): UseEntries {
  const entries = useSyncExternalStore(
    subscribeEntries,
    getEntriesSnapshot,
    getServerEntriesSnapshot,
  );

  return { entries, setField: setEntryField, clearEntries: clearAllEntries };
}
