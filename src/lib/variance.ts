export interface VarianceResult {
  planCents: number;
  actualCents: number;
  varianceCents: number;
  variancePct: number | null;
}

export function computeVariance(
  planCents: number,
  actualCents: number,
): VarianceResult {
  const varianceCents = actualCents - planCents;
  const variancePct =
    planCents === 0 ? null : (varianceCents * 100) / planCents;
  return { planCents, actualCents, varianceCents, variancePct };
}

export function formatVariancePct(pct: number | null): string {
  if (pct === null) return "-";
  const fixed = pct.toFixed(2);
  return pct > 0 ? `+${fixed}%` : `${fixed}%`;
}
