/** Milliseconds, mirroring the --dur-* custom properties in globals.css. */
export const DURATION = {
  micro: 90,
  quick: 160,
  enter: 260,
  macro: 420,
} as const;

/** Rows past this index skip the entrance stagger, so long tables still snap in. */
export const STAGGER_LIMIT = 24;

/** Rows rendered per chunk while a long list fills in behind the first paint. */
export const CHUNK_SIZE = 60;
