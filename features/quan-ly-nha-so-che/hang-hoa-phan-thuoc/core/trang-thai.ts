import { TRANG_THAI_HOAT_DONG, type TrangThaiHoatDong } from '../../../../lib/constants';

/**
 * Trạng thái hàng hoá nhóm kho (migration 044). Chỉ 'Ngừng hoạt động' là ngừng — null / chuỗi lạ
 * coi là đang hoạt động, để hàng không bao giờ "biến mất" khỏi ô chọn vì dữ liệu bẩn.
 */
export function chuanHoaTrangThaiHangHoa(raw: string | null | undefined): TrangThaiHoatDong {
  return raw === TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG
    ? TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG
    : TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG;
}

export function laHangDangHoatDong(h: { trang_thai?: string | null }): boolean {
  return chuanHoaTrangThaiHangHoa(h.trang_thai) === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG;
}

/**
 * Danh sách cho ô chọn hàng ở phiếu: bỏ hàng ngừng hoạt động, TRỪ những id đang nằm trên phiếu
 * (`giuIds`) — sửa phiếu cũ vẫn hiện đúng nhãn dòng đã chọn.
 */
export function locHangHoaChoChon<T extends { id: string; trang_thai?: string | null }>(
  list: readonly T[],
  giuIds: Iterable<string | null | undefined> = [],
): T[] {
  const giu = new Set<string>();
  for (const id of giuIds) if (id) giu.add(id);
  return list.filter((h) => laHangDangHoatDong(h) || giu.has(h.id));
}

/** Kiểm kê "Tạo danh sách": hàng ngừng hoạt động vẫn phải đếm nếu sổ còn tồn ở kho đó. */
export function canDuaVaoKiemKe(h: { trang_thai?: string | null }, tonSo: number): boolean {
  return laHangDangHoatDong(h) || tonSo !== 0;
}
