/**
 * Ai sửa / xoá được phiếu kho, và luồng "Xin sửa" phiếu đã duyệt.
 * Khớp trigger `fn_kho_pt_khoa_phieu` (migration 035) — DB chặn cả khi gọi thẳng PostgREST.
 *
 * - Cấp cao (`cap_bac = 1` hoặc admin/all trên module): luôn sửa / xoá được, và là người
 *   DUY NHẤT đổi được ngày phiếu.
 * - Phiếu 'Đã duyệt': người khác phải Xin sửa → cấp cao cấp quyền → CHỈ người xin được sửa / xoá
 *   cho tới khi cấp cao khoá lại hoặc phiếu được duyệt lại. Lưu sửa thì phiếu về 'Chờ duyệt'.
 * - Phiếu 'Chờ duyệt' / 'Không duyệt': như cũ, theo canUpdate / canDelete.
 */
import { TRANG_THAI_PT_CHO_DUYET, TRANG_THAI_PT_DA_DUYET } from './constants';
import type { PhieuKhoPT, TrangThaiPhieuKhoPT } from './types';

export const TRANG_THAI_SUA_CHO_CAP = 'cho_cap';
export const TRANG_THAI_SUA_DA_CAP = 'da_cap';

type PhieuQuyenSua = Pick<PhieuKhoPT, 'trang_thai' | 'trang_thai_sua' | 'id_nguoi_xin_sua'>;

export interface NguoiDungQuyenSua {
  capCao: boolean;
  nhanVienId: number | null | undefined;
}

/** Người đang xem chính là người xin và đã được cấp quyền. */
export function laNguoiDuocCapSua(phieu: PhieuQuyenSua, nhanVienId: number | null | undefined): boolean {
  return (
    phieu.trang_thai_sua === TRANG_THAI_SUA_DA_CAP &&
    nhanVienId != null &&
    phieu.id_nguoi_xin_sua != null &&
    Number(phieu.id_nguoi_xin_sua) === Number(nhanVienId)
  );
}

/** Phiếu có đang mở cho người này sửa / xoá không (chưa tính quyền module canUpdate/canDelete). */
export function phieuMoChoSuaXoa(phieu: PhieuQuyenSua, nguoi: NguoiDungQuyenSua): boolean {
  if (nguoi.capCao) return true;
  if (phieu.trang_thai !== TRANG_THAI_PT_DA_DUYET) return true;
  return laNguoiDuocCapSua(phieu, nguoi.nhanVienId);
}

/** Hiện nút "Xin sửa": phiếu đã duyệt, chưa có yêu cầu, người không phải cấp cao nhưng có quyền sửa/xoá. */
export function canXinSuaPhieuKhoPT(phieu: PhieuQuyenSua, nguoi: NguoiDungQuyenSua, coQuyenSuaXoa: boolean): boolean {
  return (
    coQuyenSuaXoa &&
    !nguoi.capCao &&
    phieu.trang_thai === TRANG_THAI_PT_DA_DUYET &&
    phieu.trang_thai_sua == null
  );
}

/** Cấp cao cấp quyền / từ chối: chỉ khi có yêu cầu đang chờ. */
export function canXuLyYeuCauSua(phieu: PhieuQuyenSua, capCao: boolean): boolean {
  return capCao && phieu.trang_thai_sua === TRANG_THAI_SUA_CHO_CAP;
}

/** Cấp cao khoá lại: thu quyền đã cấp. */
export function canKhoaLaiQuyenSua(phieu: PhieuQuyenSua, capCao: boolean): boolean {
  return capCao && phieu.trang_thai_sua === TRANG_THAI_SUA_DA_CAP;
}

/**
 * Trạng thái ghi xuống khi lưu bản sửa. Người được cấp sửa phiếu đã duyệt → về 'Chờ duyệt'
 * để duyệt lại; cấp cao sửa thì giữ nguyên quyết định duyệt.
 */
export function trangThaiSauKhiSua(trangThaiCu: TrangThaiPhieuKhoPT, capCao: boolean): TrangThaiPhieuKhoPT {
  if (trangThaiCu === TRANG_THAI_PT_DA_DUYET && !capCao) return TRANG_THAI_PT_CHO_DUYET;
  return trangThaiCu;
}
