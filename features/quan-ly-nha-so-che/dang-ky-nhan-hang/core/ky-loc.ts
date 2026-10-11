/**
 * Kỳ lọc theo ngày đăng ký cho chip thời gian (`components/ui/DateRangePicker`) — dùng chung
 * tab Danh sách và Thống kê. Ngoài preset chuẩn ở `lib/date-presets.ts`, thêm Hôm nay / Ngày mai
 * (in danh sách xe dự kiến) và 7 ngày qua. Thuần — `today` truyền vào để test được.
 */
import { getDateRangeFromPreset } from '../../../../lib/date-presets';

export const KY_CUSTOM = 'custom';
export const KY_TAT_CA = 'all';

/** Preset của chip ở tab Danh sách (thứ tự hiển thị). */
export const KY_PRESET_DANH_SACH = [
  KY_TAT_CA,
  'today',
  'tomorrow',
  '7days',
  'thisMonth',
  'lastMonth',
  'thisQuarter',
  'thisYear',
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
  if (preset === 'tomorrow') {
    const mai = addDaysIso(today, 1);
    return { from: mai, to: mai };
  }
  if (preset === '7days') return { from: addDaysIso(today, -6), to: today };
  if (preset === KY_CUSTOM) return { from: customStart, to: customEnd };
  const r = getDateRangeFromPreset(preset);
  return { from: r.dateFrom, to: r.dateTo };
}

/** Preset khớp với khoảng đang lọc — để chip sáng đúng; không khớp preset nào → `custom`. */
export function presetTuKhoang(
  from: string,
  to: string,
  today: string,
  presetIds: readonly string[] = KY_PRESET_DANH_SACH
): string {
  if (!from && !to) return KY_TAT_CA;
  for (const id of presetIds) {
    if (id === KY_TAT_CA || id === KY_CUSTOM) continue;
    const r = khoangTheoPreset(id, today);
    if (r.from === from && r.to === to) return id;
  }
  return KY_CUSTOM;
}
