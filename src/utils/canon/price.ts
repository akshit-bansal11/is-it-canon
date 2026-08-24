const PRICE_PATTERN = /\$([\d.]+)/;

export function parsePrice(msrp: string): number | null {
  const match = PRICE_PATTERN.exec(msrp);
  if (match?.[1] !== undefined) return Number.parseFloat(match[1]);
  return msrp === "Included" ? 0 : null;
}
