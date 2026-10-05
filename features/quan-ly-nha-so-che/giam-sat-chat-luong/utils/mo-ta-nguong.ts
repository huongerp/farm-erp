/** Mô tả ngưỡng một tiêu chí cho người đọc, vd "tổng ≤ 5 / 10 thùng", "TB 4–8", "không xét ngưỡng". */
import type { TFunction } from 'i18next';
import { formatNumberVN } from '../../../../lib/utils';
import type { TieuChi } from '../core/types';

const so = (n: number) => formatNumberVN(n, { maxFractionDigits: 2 });

export function moTaNguongTieuChi(tc: TieuChi, t: TFunction): string {
  if (tc.loai === 'dat_khong') return t('giamSatChatLuong.tieuChi.moTaDatKhong', { n: tc.nguong_max ?? 0 });
  if (tc.loai === 'dem_loi') {
    return tc.nguong_max != null
      ? t('giamSatChatLuong.tieuChi.moTaDemLoi', { max: so(tc.nguong_max) })
      : t('giamSatChatLuong.tieuChi.khongXet');
  }
  const { nguong_min: a, nguong_max: b } = tc;
  if (a == null && b == null) return t('giamSatChatLuong.tieuChi.khongXet');
  return t('giamSatChatLuong.tieuChi.moTaDoLuong', {
    khoang: a != null && b != null ? `${so(a)}–${so(b)}` : a != null ? `≥ ${so(a)}` : `≤ ${so(b!)}`,
  });
}
