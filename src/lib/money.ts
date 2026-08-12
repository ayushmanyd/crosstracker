export function parseAmountToCents(raw: string): number | null {
  const cleaned = raw
    .trim()
    .replace(/^\$\s*/, "")
    .replace(/,/g, "")
    .trim();
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;

  const [dollarsPart, centsPart = ""] = cleaned.split(".");
  const cents = Number(dollarsPart) * 100 + Number(centsPart.padEnd(2, "0"));
  return Number.isSafeInteger(cents) ? cents : null;
}

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export function formatCents(cents: number): string {
  return usdFormatter.format(cents / 100);
}

export function formatSignedCents(cents: number): string {
  return cents > 0 ? `+${formatCents(cents)}` : formatCents(cents);
}
