import { laThoiDiemIso } from '../../../lib/trao-doi-log';
import { formatDateShortTime, formatDateTimeShort } from '../../../lib/utils';

const NGAY_VN = /^(\d{1,2}\/\d{1,2})\/\d{4}(?: (\d{1,2}:\d{2}))?$/;

/**
 * Thời điểm của một mục trao đổi để hiển thị: ISO đổi theo múi giờ cài đặt;
 * `dd/mm/yyyy HH:mm` (đã là giờ địa phương) in lại. `day = false` → gọn `dd/mm HH:mm` cho ô bảng.
 */
export function hienThiThoiDiemTraoDoi(raw: string, day = false): string {
  if (laThoiDiemIso(raw)) return day ? formatDateTimeShort(raw) : formatDateShortTime(raw);
  if (day) return raw;
  const m = NGAY_VN.exec(raw.trim());
  return m ? [m[1], m[2]].filter(Boolean).join(' ') : raw;
}
