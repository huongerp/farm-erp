/** Chuỗi hiển thị dùng chung cho danh sách, chi tiết, xuất file. */
import i18n from '../../../../lib/i18n';
import { formatDate, formatTime } from '../../../../lib/utils';
import type { DangKyThamQuan } from '../core/types';

const duyNhat = (vs: (string | null)[]) => [...new Set(vs.map((v) => v?.trim()).filter((v): v is string => !!v))];

export const donViCuaPhieu = (p: DangKyThamQuan) => duyNhat(p.khach.map((k) => k.don_vi_lam_viec)).join(', ');
export const quocTichCuaPhieu = (p: DangKyThamQuan) => duyNhat(p.khach.map((k) => k.quoc_tich)).join(', ');

export function mucDichCuaPhieu(p: DangKyThamQuan): string {
  return p.muc_dich
    .map((m) => (m === 'khac' && p.muc_dich_khac ? p.muc_dich_khac : i18n.t(`dangKyThamQuan.mucDich.${m}`)))
    .join(', ');
}

/** "27/09/2026 09:00 – 16:09" (cùng ngày thì vế sau chỉ giờ). */
export function khoangThoiGian(p: Pick<DangKyThamQuan, 'tg_bat_dau' | 'tg_ket_thuc'>): string {
  const ngay = formatDate(p.tg_bat_dau);
  const tu = `${ngay} ${formatTime(p.tg_bat_dau)}`;
  if (!p.tg_ket_thuc) return tu;
  const cungNgay = ngay === formatDate(p.tg_ket_thuc);
  return `${tu} – ${cungNgay ? formatTime(p.tg_ket_thuc) : `${formatDate(p.tg_ket_thuc)} ${formatTime(p.tg_ket_thuc)}`}`;
}
