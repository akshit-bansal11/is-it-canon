"use client";

import { useEffect, useRef } from "react";

export type HotkeyMap = Record<string, () => void>;

const TYPING = new Set(["INPUT", "TEXTAREA", "SELECT"]);

/** "k" with the platform's command key held, else the bare lowercased key. */
function comboOf(event: KeyboardEvent): string {
  const key = event.key.toLowerCase();
  return event.metaKey || event.ctrlKey ? `mod+${key}` : key;
}

/**
 * Window-level shortcuts. Keys that would otherwise land in a text field are
 * ignored while one has focus — except Escape and the mod-chords, which are how
 * you get out of that field in the first place.
 */
export function useHotkeys(handlers: HotkeyMap): void {
  const latest = useRef(handlers);

  // Kept fresh in an effect rather than during render: the window listener below
  // is attached once, so it has to read the current handlers through the ref.
  useEffect(() => {
    latest.current = handlers;
  });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const combo = comboOf(event);
      const run = latest.current[combo];
      if (run === undefined) return;

      const target = event.target;
      const typing = target instanceof HTMLElement && TYPING.has(target.tagName);
      if (typing && combo !== "escape" && !combo.startsWith("mod+")) return;

      event.preventDefault();
      run();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
