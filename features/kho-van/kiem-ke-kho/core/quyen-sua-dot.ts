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

/**
 * Nhập lại kết quả / xoá MỘT dòng. Dòng đã sinh phiếu kho điều chỉnh tồn thì
 * chỉ cấp cao được đụng: sửa số thực tế hay xoá dòng lúc này đều làm dòng kiểm
 * kê lệch với phiếu điều chỉnh đã ghi vào tồn.
 */
export function coTheSuaDongKiemKe(
  dong: { id_phieu_kho_dieu_chinh?: string | null },
  trangThai: TrangThaiDotKiemKeKho,
  capCao: boolean
): boolean {
  if (!coTheSuaChiTiet(trangThai, capCao)) return false;
  return capCao || !dong.id_phieu_kho_dieu_chinh;
}

/**
 * Gõ tay SL sổ một dòng: chỉ người TẠO đợt (hoặc cấp cao). SL sổ mặc định là tồn
 * cuối ngày bắt đầu của đợt; người tạo đợt là người chốt sổ nên được hiệu chỉnh khi
 * sổ có phiếu nhập/xuất muộn. Cùng chặn như sửa dòng: đợt đã chốt / dòng đã sinh
 * phiếu điều chỉnh thì chỉ cấp cao.
 */
export function coTheSuaSoLuongSo(
  dong: { id_phieu_kho_dieu_chinh?: string | null },
  dot: { trang_thai: TrangThaiDotKiemKeKho; id_nguoi_tao?: string | null },
  userId: string | null | undefined,
  capCao: boolean
): boolean {
  if (!coTheSuaDongKiemKe(dong, dot.trang_thai, capCao)) return false;
  if (capCao) return true;
  return userId != null && dot.id_nguoi_tao != null && String(userId) === String(dot.id_nguoi_tao);
}
