/**
 * Preset kỳ dùng chung cho chip thời gian (`components/ui/DateRangePicker`).
 *
 * Đặt ở `lib/` vì nhiều module cần: import chéo giữa hai feature sẽ kéo theo cả
 * locale của feature kia (xem `lib/feature-i18n.ts` và test đi kèm).
 *
 * Ghi chú: hai bản cục bộ cũ vẫn còn —
 * `features/mua-hang/bao-cao-de-xuat-vat-tu/core/datePresets.ts` (giống hệt file này) và
 * `features/quan-ly-nha-so-che/ton-kho-phan-thuoc/core/datePresets.ts` (khác một điểm:
 * khoảng rỗng trả `'custom'` thay vì `'all'`). Gộp chúng về đây là việc dọn riêng,
 * vì đổi giá trị trả về sẽ đổi chip đang hiển thị ở các màn đó.
 */

/** Khoảng ngày của một preset (YYYY-MM-DD). `'all'` = không giới hạn thời gian. */
export function getDateRangeFromPreset(presetId: string): { dateFrom: string; dateTo: string } {
  if (presetId === 'all') return { dateFrom: '', dateTo: '' };

  const d = new Date();
  const y = d.getFullYear();
  const m = d.getMonth();
  const pad = (n: number) => String(n).padStart(2, '0');
  const today = `${y}-${pad(m + 1)}-${pad(d.getDate())}`;

  switch (presetId) {
    case 'thisMonth':
      return { dateFrom: `${y}-${pad(m + 1)}-01`, dateTo: today };
    case 'lastMonth': {
      const lastMonth = m === 0 ? 11 : m - 1;
      const lastYear = m === 0 ? y - 1 : y;
      // Ngày 0 của tháng kế = ngày cuối tháng này (tự đúng cả năm nhuận).
      const lastDay = new Date(lastYear, lastMonth + 1, 0).getDate();
      return {
        dateFrom: `${lastYear}-${pad(lastMonth + 1)}-01`,
        dateTo: `${lastYear}-${pad(lastMonth + 1)}-${pad(lastDay)}`,
      };
    }
    case 'thisQuarter': {
      const startM = Math.floor(m / 3) * 3;
      return { dateFrom: `${y}-${pad(startM + 1)}-01`, dateTo: today };
    }
    case 'thisYear':
      return { dateFrom: `${y}-01-01`, dateTo: today };
    default:
      return { dateFrom: '', dateTo: '' };
  }
}

/** Preset khớp với (dateFrom, dateTo) — để chip sáng đúng; `'custom'` khi không khớp preset nào. */
export function getPresetFromDates(dateFrom: string, dateTo: string): string {
  if (!dateFrom && !dateTo) return 'all';
  if (!dateFrom || !dateTo) return 'custom';
  for (const id of ['thisMonth', 'lastMonth', 'thisQuarter', 'thisYear']) {
    const r = getDateRangeFromPreset(id);
    if (r.dateFrom === dateFrom && r.dateTo === dateTo) return id;
  }
  return 'custom';
}
