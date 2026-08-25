"use client";

import { useEffect, useState } from "react";

interface Slice<T> {
  items: readonly T[];
  count: number;
}

/**
 * Reveals a long list in chunks instead of all at once. Nine hundred table rows
 * mounted in a single commit stalls the first paint and makes every entrance
 * animation stutter; one chunk per task keeps the main thread free between them.
 * Returns the slice to render plus whether more is still arriving.
 *
 * `items` must be referentially stable between renders — the reset below keys on
 * its identity, so an unmemoised array rebuilt every render loops forever.
 */
export function useChunked<T>(items: readonly T[], step: number): [T[], boolean] {
  const [slice, setSlice] = useState<Slice<T>>({ items, count: step });

  // Resetting during render is React's own answer to "the input changed, drop
  // the derived state" — an effect would paint the stale slice for one frame.
  if (slice.items !== items) setSlice({ items, count: step });

  const count = slice.items === items ? slice.count : step;
  const done = count >= items.length;

  useEffect(() => {
    if (slice.items !== items || slice.count >= items.length) return;

    const timer = setTimeout(() => {
      setSlice((current) =>
        current.items === items ? { items, count: current.count + step } : current,
      );
    }, 0);

    return () => clearTimeout(timer);
  }, [slice, items, step]);

  return [items.slice(0, count), !done];
}
