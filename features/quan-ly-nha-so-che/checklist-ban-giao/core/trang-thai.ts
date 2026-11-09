/**
 * Máy trạng thái phiếu checklist công đoạn — khớp trigger/RPC migration 073:
 *
 *   nhap ──Chuyển──▶ cho_kiem_tra ──Nhận──▶ hoan_thanh ──Mở lại (cấp cao)──▶ cho_kiem_tra
 *     ▲                   │
 *     └──── tra_lai ◀─────┘ Trả lại (lý do bắt buộc)
 *   nhap | tra_lai ──Huỷ──▶ huy ──Mở lại (cấp cao)──▶ nhap
 *
 * Mẫu không có khâu sau (chuc_vu_kiem_tra_ids rỗng): Chuyển → hoan_thanh luôn.
 * "Khâu cuối chịu trách nhiệm": ai bấm Nhận thì phiếu ghi tên người đó.
 */
import type { StatusBadgeSemantic } from '../../../../lib/status-badge';
import type { TrangThaiCl } from './types';

export const TRANG_THAI_CL_SEMANTIC: Record<TrangThaiCl, StatusBadgeSemantic> = {
  nhap: 'pending',
  cho_kiem_tra: 'waiting',
  tra_lai: 'rejected',
  hoan_thanh: 'success',
  huy: 'neutral',
};

/** Vai của người đang xem với một phiếu cụ thể. */
export interface VaiTroCl {
  /** Thuộc khâu làm (xem `laBenThucHien`) */
  benThucHien: boolean;
  /** Thuộc khâu kiểm tra lại (xem `laBenKiemTra`) */
  benKiemTra: boolean;
  /** Cấp bậc 1 / admin|all trên module checklist-ban-giao */
  capCao: boolean;
}

export interface NguoiDungCl {
  idNhanVien: string | null;
  chucVuId: string | null;
}

/** Mẫu / phiếu có khâu kiểm tra lại không. */
export function coKhauSau(chucVuKiemTraIds: readonly string[] | null | undefined): boolean {
  return (chucVuKiemTraIds?.length ?? 0) > 0;
}

/**
 * Khâu làm = có quyền ghi phiếu (create/update/admin/all) VÀ (mẫu không giới hạn chức vụ,
 * hoặc đúng chức vụ, hoặc là người tạo phiếu). Khớp fn_cl_la_ben_thuc_hien.
 */
export function laBenThucHien(
  chucVuThucHienIds: readonly string[] | null | undefined,
  idNguoiTao: string | null,
  nguoi: NguoiDungCl,
  coQuyenGhi: boolean
): boolean {
  if (!coQuyenGhi) return false;
  const ids = chucVuThucHienIds ?? [];
  if (ids.length === 0) return true;
  if (nguoi.chucVuId != null && ids.includes(nguoi.chucVuId)) return true;
  return idNguoiTao != null && nguoi.idNhanVien != null && idNguoiTao === nguoi.idNhanVien;
}

/** Khâu sau = đúng chức vụ trong danh sách kiểm tra lại. Khớp fn_cl_la_ben_kiem_tra. */
export function laBenKiemTra(chucVuKiemTraIds: readonly string[] | null | undefined, nguoi: NguoiDungCl): boolean {
  const ids = chucVuKiemTraIds ?? [];
  return ids.length > 0 && nguoi.chucVuId != null && ids.includes(nguoi.chucVuId);
}

function dangOKhauLam(tt: TrangThaiCl): boolean {
  return tt === 'nhap' || tt === 'tra_lai';
}

/** Tích cột khâu làm (Đạt/K.Đạt, tình trạng khắc phục, người xử lý, ghi chú). */
export function coTheSuaCotThucHien(tt: TrangThaiCl, vai: VaiTroCl): boolean {
  return vai.capCao || (dangOKhauLam(tt) && vai.benThucHien);
}

/** Tích cột kiểm tra lại. */
export function coTheSuaCotKiemTra(tt: TrangThaiCl, vai: VaiTroCl): boolean {
  return vai.capCao || (tt === 'cho_kiem_tra' && vai.benKiemTra);
}

/** Sửa thông tin chung (ngày, ca, khu vực, dây chuyền, ghi chú). */
export function coTheSuaThongTin(tt: TrangThaiCl, vai: VaiTroCl): boolean {
  return vai.capCao || (dangOKhauLam(tt) && vai.benThucHien);
}

/** Sửa kết luận vận hành / ý kiến: khâu làm lúc soạn, khâu sau lúc đang kiểm tra. */
export function coTheSuaKetLuan(tt: TrangThaiCl, vai: VaiTroCl): boolean {
  return coTheSuaThongTin(tt, vai) || (tt === 'cho_kiem_tra' && vai.benKiemTra);
}

export function coTheChuyen(tt: TrangThaiCl, vai: VaiTroCl): boolean {
  return dangOKhauLam(tt) && (vai.capCao || vai.benThucHien);
}

export function coTheNhan(tt: TrangThaiCl, vai: VaiTroCl): boolean {
  return tt === 'cho_kiem_tra' && (vai.capCao || vai.benKiemTra);
}

export function coTheTraLai(tt: TrangThaiCl, vai: VaiTroCl): boolean {
  return coTheNhan(tt, vai);
}

export function coTheHuy(tt: TrangThaiCl, vai: VaiTroCl): boolean {
  return dangOKhauLam(tt) && (vai.capCao || vai.benThucHien);
}

export function coTheMoLai(tt: TrangThaiCl, vai: VaiTroCl): boolean {
  return (tt === 'hoan_thanh' || tt === 'huy') && vai.capCao;
}

/** Xoá: cấp cao, hoặc khâu làm với phiếu nháp / đã huỷ (cần thêm quyền delete của module). */
export function coTheXoa(tt: TrangThaiCl, vai: VaiTroCl): boolean {
  return vai.capCao || ((tt === 'nhap' || tt === 'huy') && vai.benThucHien);
}

/** Trạng thái sau khi bấm Chuyển. */
export function trangThaiSauChuyen(chucVuKiemTraIds: readonly string[] | null | undefined): TrangThaiCl {
  return coKhauSau(chucVuKiemTraIds) ? 'cho_kiem_tra' : 'hoan_thanh';
}
