import type { TFunction } from 'i18next';
import type { CauHinhTanSuat, TanSuatDongBo } from '../../../lib/sheets-client';

export const DS_TAN_SUAT: TanSuatDongBo[] = ['khi_thay_doi', 'moi_gio', 'moi_4_gio', 'hang_ngay', 'hang_tuan', 'hang_thang'];

/** "Hằng tuần · Thứ 4 lúc 08:00", "Khi có thay đổi (sau ~5 phút)"… */
export function moTaTanSuat(c: CauHinhTanSuat, t: TFunction): string {
  const ten = t(`shared.export.sync.freq.${c.tanSuat}`);
  const gio = `${String(c.gio ?? 7).padStart(2, '0')}:00`;
  switch (c.tanSuat) {
    case 'hang_ngay':
      return `${ten} · ${gio}`;
    case 'hang_tuan':
      return `${ten} · ${t(`shared.export.sync.weekday.${c.thu ?? 1}`)} ${gio}`;
    case 'hang_thang':
      return `${ten} · ${(c.ngayThang ?? 1) === 31 ? t('shared.export.sync.lastDay') : t('shared.export.sync.dayN', { n: c.ngayThang ?? 1 })} ${gio}`;
    default:
      return ten;
  }
}
