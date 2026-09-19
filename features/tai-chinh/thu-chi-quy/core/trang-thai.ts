/**
 * Máy trạng thái khoá / mở của phiếu quỹ và các cổng quyền đi kèm.
 *
 * Hàm thuần, không phụ thuộc React — đây là phần sai một dòng là mất tiền thật
 * nên có test cạnh file.
 *
 *   mo ──(người tạo | cấp cao)──▶ khoa
 *   khoa ──(người tạo xin, bắt buộc lý do)──▶ cho_mo
 *   cho_mo ──(cấp cao duyệt)──▶ mo
 *   cho_mo ──(cấp cao từ chối)──▶ khoa
 *   khoa ──(cấp cao mở thẳng)──▶ mo
 *
 * "Cấp cao" = `cap_bac = 1` hoặc quyền admin/all trên module (xem
 * `use-thu-chi-quy-permissions.ts`).
 */
import { TRANG_THAI_THU_CHI_QUY } from './types';
import type { TrangThaiThuChiQuy } from './types';

/** Một phiếu chỉ cần bấy nhiêu trường để xét trạng thái — nhận cả row lẫn item. */
export interface PhieuQuyTrangThai {
  trang_thai: TrangThaiThuChiQuy;
  id_nguoi_tao?: string | null;
}

export const TRANG_THAI_THU_CHI_QUY_VALUES: readonly TrangThaiThuChiQuy[] = [
  TRANG_THAI_THU_CHI_QUY.MO,
  TRANG_THAI_THU_CHI_QUY.KHOA,
  TRANG_THAI_THU_CHI_QUY.CHO_MO,
] as const;

/** `cho_mo` vẫn là phiếu đang khoá — xin mở chưa phải được mở. */
export function isThuChiQuyLocked(item: PhieuQuyTrangThai): boolean {
  return item.trang_thai !== TRANG_THAI_THU_CHI_QUY.MO;
}

function laNguoiTao(item: PhieuQuyTrangThai, userId: string | null | undefined): boolean {
  if (!userId || !item.id_nguoi_tao) return false;
  return String(userId) === String(item.id_nguoi_tao);
}

/**
 * Sửa / xoá phiếu:
 * - Phiếu đang mở → theo đúng quyền module như trước giờ.
 * - Phiếu đã khoá (kể cả đang chờ mở) → chỉ cấp cao.
 */
export function canMutateThuChiQuy(
  item: PhieuQuyTrangThai,
  moduleAllowed: boolean,
  laCapCao: boolean
): boolean {
  if (!moduleAllowed) return false;
  if (!isThuChiQuyLocked(item)) return true;
  return laCapCao;
}

/** Khoá phiếu: người tạo phiếu tự chốt được, cấp cao chốt hộ được. */
export function canKhoaThuChiQuy(
  item: PhieuQuyTrangThai,
  laCapCao: boolean,
  userId: string | null | undefined
): boolean {
  if (item.trang_thai !== TRANG_THAI_THU_CHI_QUY.MO) return false;
  return laCapCao || laNguoiTao(item, userId);
}

/**
 * Xin mở khoá: chỉ người tạo phiếu, và chỉ khi phiếu đang `khoa`.
 * Cấp cao không phải xin — họ mở thẳng được.
 */
export function canXinMoThuChiQuy(
  item: PhieuQuyTrangThai,
  laCapCao: boolean,
  userId: string | null | undefined
): boolean {
  if (item.trang_thai !== TRANG_THAI_THU_CHI_QUY.KHOA) return false;
  if (laCapCao) return false;
  return laNguoiTao(item, userId);
}

/** Mở khoá (duyệt yêu cầu hoặc mở thẳng) — chỉ cấp cao. */
export function canDuyetMoThuChiQuy(item: PhieuQuyTrangThai, laCapCao: boolean): boolean {
  return laCapCao && isThuChiQuyLocked(item);
}

/** Từ chối yêu cầu mở (cho_mo → khoa) — chỉ cấp cao, và phải đang có yêu cầu. */
export function canTuChoiMoThuChiQuy(item: PhieuQuyTrangThai, laCapCao: boolean): boolean {
  return laCapCao && item.trang_thai === TRANG_THAI_THU_CHI_QUY.CHO_MO;
}

/** Khoá i18n nhãn trạng thái (thuChiQuy.trangThai.*). */
export function trangThaiQuyToI18nKey(trangThai: string): string {
  switch (trangThai) {
    case TRANG_THAI_THU_CHI_QUY.KHOA:
      return 'thuChiQuy.trangThai.khoa';
    case TRANG_THAI_THU_CHI_QUY.CHO_MO:
      return 'thuChiQuy.trangThai.choMo';
    default:
      return 'thuChiQuy.trangThai.mo';
  }
}

/** Badge màu theo trạng thái (mở = xám nhạt, khoá = xám đậm, chờ mở = hổ phách). */
export function getTrangThaiQuyBadgeClass(trangThai: string | null | undefined): string {
  if (trangThai === TRANG_THAI_THU_CHI_QUY.KHOA) {
    return 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20';
  }
  if (trangThai === TRANG_THAI_THU_CHI_QUY.CHO_MO) {
    return 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20';
  }
  return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20';
}
