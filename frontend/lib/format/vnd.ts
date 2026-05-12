/**
 * VND currency formatter pinned to `vi-VN` regardless of UI locale.
 *
 * Award prize money is paid in VND; switching numeric formatting to en-US
 * would yield `₫7,000,000` which is non-canonical. Per spec SC-006 and
 * `/awards` plan Notes, formatting always uses `vi-VN`.
 */
export function formatVnd(value: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
}
