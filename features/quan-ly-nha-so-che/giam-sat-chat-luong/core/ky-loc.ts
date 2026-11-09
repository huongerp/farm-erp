/**
 * Kỳ lọc theo ngày cho chip thời gian của tab Thống kê GSCL (`components/ui/DateRangePicker`).
 * Preset chuẩn lấy từ `lib/date-presets.ts`; thêm Hôm nay / 7 ngày qua. Thuần — `today`
 * truyền vào để test được.
 */
import { getDateRangeFromPreset } from '../../../../lib/date-presets';

export const KY_CUSTOM = 'custom';
export const KY_TAT_CA = 'all';

/** Preset của chip ở tab Thống kê (thứ tự hiển thị). */
export const KY_PRESET_THONG_KE = [
  'today',
  '7days',
  'thisMonth',
  'lastMonth',
  'thisQuarter',
  'thisYear',
  KY_TAT_CA,
  KY_CUSTOM,
] as const;

export function addDaysIso(ymd: string, days: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** Khoảng ngày (YYYY-MM-DD, rỗng = không giới hạn) của một preset; `custom` trả nguyên khoảng tự chọn. */
export function khoangTheoPreset(
  preset: string,
  today: string,
  customStart = '',
  customEnd = ''
): { from: string; to: string } {
  if (preset === 'today') return { from: today, to: today };
  if (preset === '7days') return { from: addDaysIso(today, -6), to: today };
  if (preset === KY_CUSTOM) return { from: customStart, to: customEnd };
  const r = getDateRangeFromPreset(preset);
  return { from: r.dateFrom, to: r.dateTo };
}
