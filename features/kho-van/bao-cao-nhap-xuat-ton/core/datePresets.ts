/**
 * Preset kỳ báo cáo: trả về dateFrom, dateTo (YYYY-MM-DD).
 */
export function getDateRangeFromPreset(presetId: string): { dateFrom: string; dateTo: string } {
  if (presetId === 'all') return { dateFrom: '', dateTo: '' };

  const d = new Date();
  const y = d.getFullYear();
  const m = d.getMonth();
  const pad = (n: number) => String(n).padStart(2, '0');
  const today = `${y}-${pad(m + 1)}-${pad(d.getDate())}`;

  switch (presetId) {
    case 'thisMonth': {
      return {
        dateFrom: `${y}-${pad(m + 1)}-01`,
        dateTo: today,
      };
    }
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
      const q = Math.floor(m / 3) + 1;
      const startM = (q - 1) * 3;
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

/** Kiểm tra (dateFrom, dateTo) có khớp preset không. */
export function getPresetFromDates(dateFrom: string, dateTo: string): string {
  if (!dateFrom || !dateTo) return 'all';
  const ranges: Array<{ id: string; get: () => { dateFrom: string; dateTo: string } }> = [
    { id: 'thisMonth', get: () => getDateRangeFromPreset('thisMonth') },
    { id: 'lastMonth', get: () => getDateRangeFromPreset('lastMonth') },
    { id: 'thisQuarter', get: () => getDateRangeFromPreset('thisQuarter') },
    { id: 'thisYear', get: () => getDateRangeFromPreset('thisYear') },
  ];
  for (const { id, get } of ranges) {
    const r = get();
    if (r.dateFrom === dateFrom && r.dateTo === dateTo) return id;
  }
  return 'custom';
}
