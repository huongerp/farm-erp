/**
 * Dòng tổng của bảng chi tiết phiếu kho (Sơ chế, Phân thuốc, kho vận). Thuần.
 * - Không cộng lẫn đơn vị: 5 Kg + 3 Bao không phải "8". Mỗi ĐVT một dòng tổng.
 * - Tổng theo phẩm cấp chỉ có nghĩa khi phiếu có ≥ 2 phẩm cấp khác nhau; một nhóm duy nhất
 *   thì trùng y dòng tổng chung → không in (trước đây in "Tổng SL — —").
 */

export interface DongChiTietSoLuong {
  pham_cap?: string | null;
  don_vi_tinh?: string | null;
  so_luong?: number | null;
}

export interface DongTong {
  /** null = dòng tổng theo ĐVT / phẩm cấp trống (chưa phân cấp). */
  phamCap: string | null;
  dvt: string | null;
  soLuong: number;
}

const sach = (v: string | null | undefined) => v?.trim() || null;

function gom(chiTiet: DongChiTietSoLuong[], theoPhamCap: boolean): DongTong[] {
  const map = new Map<string, DongTong>();
  for (const c of chiTiet) {
    const phamCap = theoPhamCap ? sach(c.pham_cap) : null;
    const dvt = sach(c.don_vi_tinh);
    // ĐVT gõ tay hay lệch hoa/thường ("Kg" / "kg") — gom chung, giữ cách viết gặp đầu tiên.
    const key = `${phamCap ?? ''}\u0000${dvt?.toLocaleLowerCase('vi') ?? ''}`;
    const cu = map.get(key);
    if (cu) cu.soLuong += Number(c.so_luong) || 0;
    else map.set(key, { phamCap, dvt, soLuong: Number(c.so_luong) || 0 });
  }
  return Array.from(map.values());
}

/** Tổng số lượng theo từng ĐVT, giữ thứ tự xuất hiện. */
export function tongTheoDvt(chiTiet: DongChiTietSoLuong[]): DongTong[] {
  return gom(chiTiet, false);
}

/**
 * Tổng theo (phẩm cấp, ĐVT) — rỗng khi phiếu có dưới 2 phẩm cấp khác nhau (kể cả nhóm trống).
 * Sắp theo tên phẩm cấp (vi), nhóm chưa phân cấp cuối.
 */
export function tongTheoPhamCap(chiTiet: DongChiTietSoLuong[]): DongTong[] {
  const nhom = new Set(chiTiet.map((c) => sach(c.pham_cap)));
  if (nhom.size < 2) return [];
  return gom(chiTiet, true).sort((a, b) => {
    if (a.phamCap == null) return b.phamCap == null ? 0 : 1;
    if (b.phamCap == null) return -1;
    return a.phamCap.localeCompare(b.phamCap, 'vi');
  });
}

/** Cột có ít nhất một ô khác trống — dùng ẩn cột toàn "—" trên bản in. */
export function cotCoDuLieu<T>(rows: T[], lay: (r: T) => unknown): boolean {
  return rows.some((r) => {
    const v = lay(r);
    return v != null && String(v).trim() !== '';
  });
}
