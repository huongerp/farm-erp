import type { FarmBaoCaoNhanCong } from './types';
import { TRANG_THAI_BAO_CAO_NHAN_CONG } from './types';
import { laCapBacToanQuyen } from '../../../he-thong/phan-quyen/core/cap-bac-toan-quyen';

export const BAO_CAO_NHAN_CONG_MODULE_ID = 'quan-ly-nha-so-che/bao-cao-nhan-cong' as const;

export function isBaoCaoNhanCongLocked(item: FarmBaoCaoNhanCong): boolean {
  return item.trang_thai === TRANG_THAI_BAO_CAO_NHAN_CONG.KHOA;
}

/**
 * Sửa / xóa phiếu:
 * - Quản trị (`admin` / `all`) → được sửa/xóa tất cả.
 * - Quyền thường (Sửa/Xóa) → sửa/xóa mọi phiếu chưa khóa.
 */
export function canMutateBaoCaoNhanCong(
  item: FarmBaoCaoNhanCong,
  moduleAllowed: boolean,
  moduleCanAdmin: boolean
): boolean {
  if (moduleCanAdmin) return true;
  if (!moduleAllowed) return false;
  return !isBaoCaoNhanCongLocked(item);
}

/** Khóa / mở khóa phiếu — chỉ quyền quản trị module. */
export function canToggleTrangThaiBaoCaoNhanCong(moduleCanAdmin: boolean): boolean {
  return moduleCanAdmin;
}

/** Sao chép sang ngày kế — quyền Thêm (tạo phiếu mới). */
export function canCopyBaoCaoNhanCongToNextDay(moduleCanCreate: boolean): boolean {
  return moduleCanCreate;
}

export interface QuyenThemViTriInput {
  /** fp_var_nhan_vien.cap_bac — có thể là số / chuỗi / null. */
  capBac?: unknown;
  /** actions của chức vụ trên module báo cáo nhân công (fp_var_phan_quyen). */
  actions?: readonly string[] | null;
  /** canAdmin đã tính sẵn từ ModulePermissionGuard (admin/all hoặc cap_bac = 1). */
  canAdmin?: boolean;
}

/**
 * Thêm vị trí công việc MỚI vào danh mục dùng chung — chỉ cấp cao: `cap_bac = 1` hoặc quyền
 * `admin` / `all` trên module. Người khác chỉ chọn vị trí có sẵn. Khớp policy INSERT ở migration 068.
 */
export function coQuyenThemViTri(input: QuyenThemViTriInput | null | undefined): boolean {
  if (!input) return false;
  if (input.canAdmin === true) return true;
  if (laCapBacToanQuyen(input.capBac)) return true;
  const actions = input.actions ?? [];
  return actions.includes('admin') || actions.includes('all');
}
