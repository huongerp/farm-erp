/**
 * Preset kỳ báo cáo hợp đồng: trả về dateFrom, dateTo (YYYY-MM-DD).
 * 'all' = không giới hạn thời gian.
 */
export function getDateRangeFromPreset(presetId: string): { dateFrom: string; dateTo: string } {
  if (presetId === 'all') return { dateFrom: '', dateTo: '' };

  const d = new Date();
  const y = d.getFullYear();
  const m = d.getMonth();
  const pad = (n: number) => String(n).padStart(2, '0');
  const today = `${y}-${pad(m + 1)}-${pad(d.getDate())}`;

  switch (presetId) {
    case 'thisMonth':
      return {
        dateFrom: `${y}-${pad(m + 1)}-01`,
        dateTo: today,
      };
    case 'lastMonth': {
      const lastMonth = m === 0 ? 11 : m - 1;
      const lastYear = m === 0 ? y - 1 : y;
      const lastDay = new Date(lastYear, lastMonth + 1, 0).getDate();
      return {
        dateFrom: `${lastYear}-${pad(lastMonth + 1)}-01`,
        dateTo: `${lastYear}-${pad(lastMonth + 1)}-${pad(lastDay)}`,
      };
    }
    case 'thisQuarter': {
      const startM = Math.floor(m / 3) * 3;
      return {
        dateFrom: `${y}-${pad(startM + 1)}-01`,
        dateTo: today,
      };
    }
    case 'thisYear':
      return {
        dateFrom: `${y}-01-01`,
        dateTo: today,
      };
    default:
      return { dateFrom: '', dateTo: '' };
  }
}

/** Khớp (dateFrom, dateTo) với preset nhanh; không khớp → custom. */
/** Lọc theo trường ngày YYYY-MM-DD (hợp đồng / đợt thanh toán). */
export function inNgayRange(ngay: string | null | undefined, dateFrom: string, dateTo: string): boolean {
  if (!dateFrom && !dateTo) return true;
  if (!ngay) return false;
  if (dateFrom && ngay < dateFrom) return false;
  if (dateTo && ngay > dateTo) return false;
  return true;
}

export function getPresetFromDates(dateFrom: string, dateTo: string): string {
  if (!dateFrom && !dateTo) return 'all';
  if (!dateFrom || !dateTo) return 'custom';

  const presetIds = ['thisMonth', 'lastMonth', 'thisQuarter', 'thisYear'] as const;
  for (const id of presetIds) {
    const r = getDateRangeFromPreset(id);
    if (r.dateFrom === dateFrom && r.dateTo === dateTo) return id;
  }
  return 'custom';
}
