/** Khoá i18n dùng chung cho bản in và bản Excel của phiếu kho NSC / Phân thuốc. */
import type { LoaiPhieuKhoPT, TrangThaiPhieuKhoPT } from '../core/types';

const TIEU_DE: Record<LoaiPhieuKhoPT, string> = {
  nhập: 'phieuKhoPhanThuoc.preview.tieuDe_nhap',
  xuất: 'phieuKhoPhanThuoc.preview.tieuDe_xuat',
  chuyển: 'phieuKhoPhanThuoc.preview.tieuDe_chuyen',
};

const TRANG_THAI: Record<TrangThaiPhieuKhoPT, string> = {
  'Chờ duyệt': 'phieuKhoPhanThuoc.status.pending',
  'Đã duyệt': 'phieuKhoPhanThuoc.status.approved',
  'Không duyệt': 'phieuKhoPhanThuoc.status.rejected',
};

/** Tiêu đề phiếu — có tham số `{{kho}}` (tên kho theo biến thể). */
export const tieuDePhieuKhoPTKey = (loai: LoaiPhieuKhoPT): string => TIEU_DE[loai] ?? TIEU_DE['nhập'];

/** Trạng thái lạ (dữ liệu cũ) giữ nguyên chữ gốc thay vì in nhầm "Không duyệt". */
export const trangThaiPhieuKhoPTKey = (trangThai: string): string =>
  TRANG_THAI[trangThai as TrangThaiPhieuKhoPT] ?? trangThai;
