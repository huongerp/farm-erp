/**
 * Máy trạng thái duyệt của phiếu quỹ và các cổng quyền đi kèm.
 *
 * Hàm thuần, không phụ thuộc React — đây là phần sai một dòng là mất tiền thật
 * nên có test cạnh file.
 *
 *   cho_duyet ──duyệt──▶ da_duyet
 *   cho_duyet ──không duyệt (bắt buộc lý do)──▶ khong_duyet
 *   da_duyet ⇄ khong_duyet                     (cấp cao đổi ý)
 *   da_duyet | khong_duyet ──đưa về──▶ cho_duyet
 *
 * Mọi chuyển trạng thái chỉ dành cho "cấp cao" = `cap_bac = 1` hoặc quyền admin/all
 * trên module (xem `use-thu-chi-quy-permissions.ts`). Phiếu `khong_duyet` không tính
 * vào tồn quỹ / thống kê (view + RPC ở migration 036 lọc cùng luật với `tinhVaoTonQuy`).
 */
import { TRANG_THAI_THU_CHI_QUY } from './types';
import type { TrangThaiThuChiQuy } from './types';

/** Một phiếu chỉ cần bấy nhiêu trường để xét trạng thái — nhận cả row lẫn item. */
export interface PhieuQuyTrangThai {
  trang_thai: TrangThaiThuChiQuy;
  id_nguoi_tao?: string | null;
}

export const TRANG_THAI_THU_CHI_QUY_VALUES: readonly TrangThaiThuChiQuy[] = [
  TRANG_THAI_THU_CHI_QUY.CHO_DUYET,
  TRANG_THAI_THU_CHI_QUY.DA_DUYET,
  TRANG_THAI_THU_CHI_QUY.KHONG_DUYET,
] as const;

/** Đã xét xong (duyệt hoặc không duyệt) thì người thường hết sửa/xoá. */
export function isThuChiQuyLocked(item: PhieuQuyTrangThai): boolean {
  return item.trang_thai !== TRANG_THAI_THU_CHI_QUY.CHO_DUYET;
}

/** Phiếu có được cộng vào tồn quỹ / thống kê không — chỉ `khong_duyet` bị loại. */
export function tinhVaoTonQuy(item: Pick<PhieuQuyTrangThai, 'trang_thai'>): boolean {
  return item.trang_thai !== TRANG_THAI_THU_CHI_QUY.KHONG_DUYET;
}

/**
 * Sửa / xoá phiếu:
 * - Phiếu chờ duyệt → theo đúng quyền module như trước giờ.
 * - Phiếu đã duyệt / không duyệt → chỉ cấp cao.
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

/** Duyệt: cấp cao, từ chờ duyệt hoặc đổi ý từ không duyệt. */
export function canDuyetThuChiQuy(item: PhieuQuyTrangThai, laCapCao: boolean): boolean {
  return laCapCao && item.trang_thai !== TRANG_THAI_THU_CHI_QUY.DA_DUYET;
}

/** Không duyệt: cấp cao, từ chờ duyệt hoặc đổi ý từ đã duyệt. */
export function canKhongDuyetThuChiQuy(item: PhieuQuyTrangThai, laCapCao: boolean): boolean {
  return laCapCao && item.trang_thai !== TRANG_THAI_THU_CHI_QUY.KHONG_DUYET;
}

/** Đưa về chờ duyệt: cấp cao, phiếu đã được xét. */
export function canTraVeChoDuyetThuChiQuy(item: PhieuQuyTrangThai, laCapCao: boolean): boolean {
  return laCapCao && item.trang_thai !== TRANG_THAI_THU_CHI_QUY.CHO_DUYET;
}

/* ------------------------------------------------------------------ */
/* Thao tác hàng loạt                                                  */
/* ------------------------------------------------------------------ */

export type HanhDongBulkThuChiQuy = 'duyet' | 'khong_duyet' | 'tra_ve' | 'xoa';

/**
 * Trạng thái nguồn hợp lệ cho từng hành động — service dùng làm điều kiện
 * `.in('trang_thai', …)` của lệnh UPDATE, nên phiếu vừa bị người khác đổi trạng
 * thái giữa lúc chọn và lúc bấm sẽ không bị ghi đè.
 */
export const TRANG_THAI_NGUON_BULK: Record<Exclude<HanhDongBulkThuChiQuy, 'xoa'>, TrangThaiThuChiQuy[]> = {
  duyet: [TRANG_THAI_THU_CHI_QUY.CHO_DUYET, TRANG_THAI_THU_CHI_QUY.KHONG_DUYET],
  khong_duyet: [TRANG_THAI_THU_CHI_QUY.CHO_DUYET, TRANG_THAI_THU_CHI_QUY.DA_DUYET],
  tra_ve: [TRANG_THAI_THU_CHI_QUY.DA_DUYET, TRANG_THAI_THU_CHI_QUY.KHONG_DUYET],
};

export interface NguCanhBulkThuChiQuy {
  laCapCao: boolean;
  /** Quyền xoá của module — chỉ dùng cho hành động `xoa`. */
  coQuyenXoa?: boolean;
}

/**
 * Lọc các phiếu đã chọn xuống những phiếu người dùng thật sự được làm `hanhDong`.
 *
 * Nhận `ids` (lựa chọn giữ qua nhiều trang) cùng `rows` tra từ DB theo đúng các id
 * đó. Id không có trong `rows` (đã bị xoá / ngoài phạm vi) bị BỎ QUA — fail-closed,
 * không mặc định cho phép như trước.
 */
export function phanLoaiBulkThuChiQuy<T extends PhieuQuyTrangThai & { id: string }>(
  ids: readonly string[],
  rows: readonly T[],
  hanhDong: HanhDongBulkThuChiQuy,
  ctx: NguCanhBulkThuChiQuy
): { hopLe: T[]; boQua: number } {
  const byId = new Map(rows.map((r) => [String(r.id), r]));
  const duocPhep = (row: T): boolean => {
    switch (hanhDong) {
      case 'duyet':
        return canDuyetThuChiQuy(row, ctx.laCapCao);
      case 'khong_duyet':
        return canKhongDuyetThuChiQuy(row, ctx.laCapCao);
      case 'tra_ve':
        return canTraVeChoDuyetThuChiQuy(row, ctx.laCapCao);
      case 'xoa':
        return canMutateThuChiQuy(row, !!ctx.coQuyenXoa, ctx.laCapCao);
    }
  };
  const hopLe: T[] = [];
  const daXet = new Set<string>();
  for (const id of ids) {
    const key = String(id);
    if (daXet.has(key)) continue;
    daXet.add(key);
    const row = byId.get(key);
    if (row && duocPhep(row)) hopLe.push(row);
  }
  return { hopLe, boQua: daXet.size - hopLe.length };
}

/**
 * Ngày phiếu quỹ quyết định thứ tự tồn quỹ lũy kế → chỉ cấp cao được chọn / đổi ngày.
 * Người thường: phiếu mới luôn mang ngày hôm nay, sửa phiếu giữ nguyên ngày.
 * DB chặn lại cùng luật ở trigger `fn_tc_quy_khoa_duyet` (migration 043).
 */
export function canSuaNgayThuChiQuy(laCapCao: boolean): boolean {
  return laCapCao;
}

/** Khoá i18n nhãn trạng thái (thuChiQuy.trangThai.*). */
export function trangThaiQuyToI18nKey(trangThai: string): string {
  switch (trangThai) {
    case TRANG_THAI_THU_CHI_QUY.DA_DUYET:
      return 'thuChiQuy.trangThai.daDuyet';
    case TRANG_THAI_THU_CHI_QUY.KHONG_DUYET:
      return 'thuChiQuy.trangThai.khongDuyet';
    default:
      return 'thuChiQuy.trangThai.choDuyet';
  }
}

/** Badge màu theo trạng thái (chờ duyệt = hổ phách, đã duyệt = xanh lá, không duyệt = đỏ). */
export function getTrangThaiQuyBadgeClass(trangThai: string | null | undefined): string {
  if (trangThai === TRANG_THAI_THU_CHI_QUY.DA_DUYET) {
    return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20';
  }
  if (trangThai === TRANG_THAI_THU_CHI_QUY.KHONG_DUYET) {
    return 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20';
  }
  return 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20';
}
