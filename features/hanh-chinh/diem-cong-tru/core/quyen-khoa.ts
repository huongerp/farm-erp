/**
 * Quyền khoá / mở khoá bản ghi Điểm cộng trừ — khớp trigger `fn_hr_diem_cong_tru_khoa` (migration 066).
 * Chỉ quản trị module (admin/all) hoặc nhân viên cấp bậc 1 được đổi trạng thái; bản ghi đang khoá
 * thì người thường chỉ xem, quản trị / cấp bậc 1 vẫn sửa, xoá được.
 */
import type { DiemCongTruRecord } from './types';

export interface QuyenDiemCongTru {
  canAdmin: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

type BanGhiKhoa = Pick<DiemCongTruRecord, 'id' | 'trang_thai'>;

export const laBanGhiKhoa = (item: BanGhiKhoa): boolean => item.trang_thai === 'khoa';

export const coTheDoiKhoa = (quyen: Pick<QuyenDiemCongTru, 'canAdmin'>, capBacToanQuyen: boolean): boolean =>
  quyen.canAdmin || capBacToanQuyen;

export const coTheSua = (item: BanGhiKhoa, quyen: QuyenDiemCongTru, capBacToanQuyen: boolean): boolean => {
  if (coTheDoiKhoa(quyen, capBacToanQuyen)) return true;
  return quyen.canUpdate && !laBanGhiKhoa(item);
};

export const coTheXoa = (item: BanGhiKhoa, quyen: QuyenDiemCongTru, capBacToanQuyen: boolean): boolean => {
  if (coTheDoiKhoa(quyen, capBacToanQuyen)) return true;
  return quyen.canDelete && !laBanGhiKhoa(item);
};
