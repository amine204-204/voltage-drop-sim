export const MAX_DECIMALS = 2;
export const MISSING_VALUE = '—';

/* Renders a number with at most MAX_DECIMALS digits after the decimal point.
   Trailing zeros are trimmed (e.g. 230.00 -> '230', 0.10 -> '0.1'). */
export function formatNum(
  value: number | null | undefined,
  maxDecimals: number = MAX_DECIMALS
): string {
  if (value === null || value === undefined || !isFinite(value)) {
    return MISSING_VALUE;
  }
  const decimals = Number.isFinite(maxDecimals)
    ? Math.min(Math.max(Math.trunc(maxDecimals), 0), MAX_DECIMALS)
    : MAX_DECIMALS;
  const trimmed = value.toFixed(decimals).replace(/\.?0+$/, '');
  return trimmed === '-0' ? '0' : trimmed;
}
