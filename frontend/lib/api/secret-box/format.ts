/**
 * Pure formatting helpers for the Secret Box screen.
 *
 * `formatCount` zero-pads two-digit values (< 100) per FR-010, but renders the
 * raw integer when >= 100 so the BE-side maximum of 100 is shown without
 * truncation (test case `ce44f5ed`).
 */
export function formatCount(value: number): string {
  if (!Number.isFinite(value) || value < 0) return '00';
  const intValue = Math.floor(value);
  if (intValue >= 100) return String(intValue);
  return intValue.toString().padStart(2, '0');
}

/**
 * Parse the `Retry-After` HTTP header. Supports both delta-seconds and
 * HTTP-date formats. Returns seconds (>= 0) or `undefined` if absent/invalid.
 */
export function parseRetryAfter(
  headers: Headers | null | undefined,
): number | undefined {
  if (!headers) return undefined;
  const raw = headers.get('retry-after') ?? headers.get('Retry-After');
  if (!raw) return undefined;
  const asInt = Number.parseInt(raw, 10);
  if (Number.isFinite(asInt) && asInt >= 0 && String(asInt) === raw.trim()) {
    return asInt;
  }
  const asDate = Date.parse(raw);
  if (Number.isFinite(asDate)) {
    const delta = Math.ceil((asDate - Date.now()) / 1000);
    return delta > 0 ? delta : 0;
  }
  return undefined;
}
