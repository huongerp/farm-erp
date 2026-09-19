/**
 * Ai được đụng vào đợt kiểm kê đã chốt sổ.
 *
 * Đợt `hoan_thanh` là bản chốt: người thường không sửa / xoá / thêm bớt dòng,
 * và cũng không đưa nó ngược về trạng thái khác được. Chỉ "cấp cao" mới mở khoá
 * — cùng quy ước với phạm vi xem: `cap_bac = 1` hoặc quyền `admin`/`all` trên
 * module (xem CLAUDE.md, mục Phân quyền).
 *
 * Tách riêng để service, hook và UI dùng chung một luật — trước đây điều kiện
 * `trang_thai === 'hoan_thanh'` nằm rải rác ở 5 chỗ trong service và 2 chỗ trong
 * component, sửa một nơi rất dễ sót nơi khác.
 */
import type { TrangThaiDotKiemKeKho } from './types';

/** Sửa thông tin đợt (tên, ngày, người phụ trách, phạm vi kho). */
export function coTheSuaDot(trangThai: TrangThaiDotKiemKeKho, capCao: boolean): boolean {
  return capCao || trangThai !== 'hoan_thanh';
}

/** Xoá đợt. */
export function coTheXoaDot(trangThai: TrangThaiDotKiemKeKho, capCao: boolean): boolean {
  return capCao || trangThai !== 'hoan_thanh';
}

/** Thêm / xoá dòng chi tiết, tạo danh sách kiểm kê. */
export function coTheSuaChiTiet(trangThai: TrangThaiDotKiemKeKho, capCao: boolean): boolean {
  return capCao || trangThai !== 'hoan_thanh';
}

/**
 * Chuyển trạng thái đợt. Chặn cả lối vòng: người thường đưa đợt đã chốt về
 * `dang_kiem_ke` rồi sửa thoải mái thì chốt sổ thành vô nghĩa.
 */
export function coTheChuyenTrangThaiDot(
  trangThaiHienTai: TrangThaiDotKiemKeKho,
  capCao: boolean
): boolean {
  return capCao || trangThaiHienTai !== 'hoan_thanh';
}
