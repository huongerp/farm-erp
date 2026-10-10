/**
 * Dữ liệu mẫu in phiếu hành chính — thuần, không phụ thuộc React / store.
 * Bản in dựng ở components/preview/ (React) từ kết quả của `duLieuPhieuIn`.
 */
import type { TFunction } from 'i18next';
import type { AdminFormRequest } from './types';
import { getAdminFormShiftLabel } from './constants';
import { laLoaiTheoKhoang } from './khoang-nghi';
import { getAdminFormTypeLabel } from '../../thiet-lap-cong-luong/core/constants';
import { hienThiSoNgay } from '../utils/hien-thi-khoang';

/** Ô tick ở mục Kết quả xử lý + dấu trạng thái. */
export type KetQuaIn = 'dong_y' | 'khong_dong_y' | 'cho' | 'huy';

export interface DuLieuPhieuIn {
  soPhieu: string;
  tieuDe: string;
  ngayLap: string;
  nguoiDeNghi: string;
  phongBan: string;
  loaiPhieu: string;
  thoiGian: string;
  /** null với loại phiếu nhập theo ca (đi muộn, tăng ca…) — số ngày không có nghĩa. */
  soNgay: string | null;
  lyDo: string;
  ketQua: KetQuaIn;
  ghiChu: string;
  /** null khi phiếu còn chờ duyệt. */
  ngayXuLy: string | null;
}

/** `yyyy-mm-dd` → `dd/mm/yyyy` (không qua múi giờ: cột date ở DB). */
export const ddmmyyyy = (ngay: string): string =>
  /^\d{4}-\d{2}-\d{2}/.test(ngay) ? `${ngay.slice(8, 10)}/${ngay.slice(5, 7)}/${ngay.slice(0, 4)}` : ngay;

export const soPhieuIn = (id: string): string => `PHC-${id.padStart(5, '0')}`;

export function ketQuaIn(trangThai: AdminFormRequest['trang_thai']): KetQuaIn {
  if (trangThai === 'approved') return 'dong_y';
  if (trangThai === 'rejected') return 'khong_dong_y';
  if (trangThai === 'cancelled') return 'huy';
  return 'cho';
}

/** "Chiều 01/10/2026 → Sáng 03/10/2026" hoặc "Ngày 05/10/2026 – Cả ngày". */
export function thoiGianIn(p: AdminFormRequest, t: TFunction): string {
  if (p.den_ngay && p.den_ngay !== p.ngay) {
    const buoi = (b: AdminFormRequest['tu_buoi']) => t(`adminForm.session.${b}`);
    return `${buoi(p.tu_buoi)} ${ddmmyyyy(p.ngay)} → ${buoi(p.den_buoi)} ${ddmmyyyy(p.den_ngay)}`;
  }
  return `${t('adminForm.print.ngay')} ${ddmmyyyy(p.ngay)} – ${getAdminFormShiftLabel(p.ca, t)}`;
}

export function duLieuPhieuIn(
  p: AdminFormRequest,
  t: TFunction,
  /** Định dạng mốc giờ (tg_tao, tg_cap_nhat) — truyền từ lib/utils để giữ file này thuần. */
  dinhDangNgayGio: (iso: string) => string
): DuLieuPhieuIn {
  const ketQua = ketQuaIn(p.trang_thai);
  return {
    soPhieu: soPhieuIn(p.id),
    tieuDe: t(`adminForm.print.title.${p.loai_phieu}`),
    ngayLap: p.tg_tao ? dinhDangNgayGio(p.tg_tao) : '',
    nguoiDeNghi: p.ten_nguoi_tao ?? '',
    phongBan: p.ten_phong_ban ?? '',
    loaiPhieu: getAdminFormTypeLabel(p.loai_phieu, t),
    thoiGian: thoiGianIn(p, t),
    soNgay: laLoaiTheoKhoang(p.loai_phieu) ? hienThiSoNgay(p) : null,
    lyDo: (p.ly_do ?? '').trim(),
    ketQua,
    ghiChu: (p.ghi_chu ?? '').trim(),
    ngayXuLy: ketQua !== 'cho' && p.tg_cap_nhat ? dinhDangNgayGio(p.tg_cap_nhat) : null,
  };
}

/** Mọi giá trị người dùng nhập đều qua đây trước khi ghép vào HTML in. */
export { escapeHtml } from '../../../../lib/escape-html';
