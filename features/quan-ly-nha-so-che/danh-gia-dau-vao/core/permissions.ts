/**
 * Quy tắc quyền phiếu Đánh giá đầu vào (tầng app) — khớp RLS migration 052:
 * - ghi phiếu: create / update / delete trên module; bảng con (cột, lô, ô lưới) = create hoặc update;
 * - ghi danh mục (Cài đặt ⚙): cấp cao (cấp bậc 1 / chức vụ tt = 1) hoặc admin module.
 * Phiếu là sổ chung của cả tuần (nhiều người nhập theo ngày) nên KHÔNG giới hạn theo người tạo,
 * trừ quyền xoá phiếu (chỉ người tạo hoặc quản trị).
 */
import { TRANG_THAI_DGDV, type FarmDgdv } from './types';

export interface DgdvQuyenModule {
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canAdmin: boolean;
}

type PhieuQuyen = Pick<FarmDgdv, 'trang_thai' | 'id_nguoi_tao'>;

export const phieuDaKhoa = (p: Pick<FarmDgdv, 'trang_thai'>) => p.trang_thai === TRANG_THAI_DGDV.KHOA;

/** Sửa đầu phiếu (form): quản trị luôn được; còn lại cần `update` và phiếu chưa khoá. */
export function coTheSuaPhieu(p: PhieuQuyen, q: DgdvQuyenModule): boolean {
  if (q.canAdmin) return true;
  return q.canUpdate && !phieuDaKhoa(p);
}

/** Xoá phiếu: quản trị luôn được; còn lại cần `delete`, phiếu chưa khoá và do mình tạo. */
export function coTheXoaPhieu(p: PhieuQuyen, q: DgdvQuyenModule, userId: string | null | undefined): boolean {
  if (q.canAdmin) return true;
  if (!q.canDelete || phieuDaKhoa(p)) return false;
  return !!userId && !!p.id_nguoi_tao && String(userId) === String(p.id_nguoi_tao);
}

/**
 * Nhập lưới (ô số, đứt dây, ghi chú lô): phiếu khoá thì MỌI người chỉ xem (quản trị mở khoá trước);
 * còn lại cần create / update / admin như RLS bảng con.
 */
export function coTheNhapLuoi(p: Pick<FarmDgdv, 'trang_thai'>, q: DgdvQuyenModule): boolean {
  if (phieuDaKhoa(p)) return false;
  return q.canAdmin || q.canCreate || q.canUpdate;
}

/** Khoá / mở khoá: chỉ quản trị module. */
export const coTheDoiTrangThai = (q: DgdvQuyenModule) => q.canAdmin;

/** Dialog Cài đặt (ghi danh mục): cấp cao hoặc quản trị module. */
export const coTheCaiDat = (q: Pick<DgdvQuyenModule, 'canAdmin'>, capBacToanQuyen: boolean) =>
  capBacToanQuyen || q.canAdmin;
