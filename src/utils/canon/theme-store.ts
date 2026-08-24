import { THEME_STORAGE_KEY } from "@/constants/canon/storage";
import type { Theme } from "@/types/canon/theme";

const listeners = new Set<() => void>();
let cache: Theme | null = null;

export function subscribeTheme(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getThemeSnapshot(): Theme {
  cache ??= document.documentElement.dataset.theme === "light" ? "light" : "dark";
  return cache;
}

export function getServerThemeSnapshot(): Theme {
  return "dark";
}

export function toggleTheme(): void {
  const next: Theme = getThemeSnapshot() === "dark" ? "light" : "dark";
  cache = next;
  document.documentElement.dataset.theme = next;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, next);
  } catch (error) {
    console.warn("theme write failed", error);
  }
  for (const listener of listeners) listener();
}
