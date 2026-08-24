import { THEME_STORAGE_KEY } from "@/constants/canon/storage";
import type { Theme } from "@/types/canon/theme";

const listeners = new Set<() => void>();
let observer: MutationObserver | null = null;

function emit(): void {
  for (const listener of listeners) listener();
}

export function subscribeTheme(listener: () => void): () => void {
  listeners.add(listener);

  // `public/theme.js` stamps data-theme before hydration, but a late-running
  // script, devtools, or another tab can move it afterwards. Watching the
  // attribute keeps the rendered label honest instead of trusting one read.
  if (observer === null) {
    observer = new MutationObserver(emit);
    observer.observe(document.documentElement, { attributeFilter: ["data-theme"] });
  }

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      observer?.disconnect();
      observer = null;
    }
  };
}

/**
 * Read straight from the DOM on every call — no cache. The snapshot is a
 * string, so `useSyncExternalStore` compares it by value and will not loop,
 * and there is no cached copy left to drift from the attribute in play.
 */
export function getThemeSnapshot(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

export function getServerThemeSnapshot(): Theme {
  return "dark";
}

export function toggleTheme(): void {
  const next: Theme = getThemeSnapshot() === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, next);
  } catch (error) {
    console.warn("theme write failed", error);
  }
  emit();
}
