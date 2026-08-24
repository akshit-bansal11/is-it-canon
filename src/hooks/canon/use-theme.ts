"use client";

import { useSyncExternalStore } from "react";
import type { Theme } from "@/types/canon/theme";
import {
  getServerThemeSnapshot,
  getThemeSnapshot,
  subscribeTheme,
  toggleTheme,
} from "@/utils/canon/theme-store";

export interface UseTheme {
  theme: Theme;
  toggleTheme: () => void;
}

export function useTheme(): UseTheme {
  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getServerThemeSnapshot);
  return { theme, toggleTheme };
}
