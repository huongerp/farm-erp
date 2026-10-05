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
import type { TrangThaiDotKiemKePT } from './types';

/** Sửa thông tin đợt (tên, ngày, người phụ trách, phạm vi kho). */
export function coTheSuaDotPT(trangThai: TrangThaiDotKiemKePT, capCao: boolean): boolean {
  return capCao || trangThai !== 'hoan_thanh';
}

/** Xoá đợt. */
export function coTheXoaDotPT(trangThai: TrangThaiDotKiemKePT, capCao: boolean): boolean {
  return capCao || trangThai !== 'hoan_thanh';
}

/** Thêm / xoá dòng chi tiết, tạo danh sách kiểm kê. */
export function coTheSuaChiTietPT(trangThai: TrangThaiDotKiemKePT, capCao: boolean): boolean {
  return capCao || trangThai !== 'hoan_thanh';
}

/**
 * Nút "Chuyển trạng thái" — đổi tự do sang bất kỳ trạng thái nào, kể cả đưa đợt
 * đã chốt ngược về `dang_kiem_ke` / `draft` → chỉ cấp cao, ở MỌI trạng thái.
 * Luồng nghiệp vụ thường không đi qua đây: Tạo danh sách (Nháp → Đang kiểm kê) và
 * nút Hoàn thành (Đang kiểm kê → Hoàn thành) vẫn theo quyền `update`.
 */
export function coTheChuyenTrangThaiDotPT(capCao: boolean): boolean {
  return capCao;
}

/**
 * Nhập lại kết quả / xoá MỘT dòng. Dòng đã sinh phiếu kho điều chỉnh tồn thì
 * chỉ cấp cao được đụng: sửa số thực tế hay xoá dòng lúc này đều làm dòng kiểm
 * kê lệch với phiếu điều chỉnh đã ghi vào tồn.
 */
export function coTheSuaDongKiemKePT(
  dong: { id_phieu_kho_dieu_chinh?: string | null },
  trangThai: TrangThaiDotKiemKePT,
  capCao: boolean
): boolean {
  if (!coTheSuaChiTietPT(trangThai, capCao)) return false;
  return capCao || !dong.id_phieu_kho_dieu_chinh;
}
