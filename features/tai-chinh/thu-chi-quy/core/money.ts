/**
 * Chuẩn hóa số tiền / số lượng nhập tay (ô nhập, Excel dán vào) về number.
 * Thuần, không phụ thuộc React — test cạnh file.
 */

/**
 * Parse số kiểu Việt Nam: `1.200.000` → 1200000, `1.234,5` → 1234.5,
 * `1,200,000` → 1200000, `1,5` → 1.5. Rỗng/null → null. Không parse được → null.
 *
 * Khác `lib/import-common.ts#parseImportNumber` ở chỗ đó phân biệt "ô trống" với
 * "sai định dạng" để báo lỗi dòng import; ở form thì zod lo phần báo lỗi.
 */
export function coerceSoTien(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;

  const s = String(raw).replace(/\s/g, '').replace(/[₫đ]/gi, '');
  if (s === '') return null;

  let normalized: string;
  if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) {
    // 1.234.567,89 — nghìn bằng dấu chấm (chuẩn VN)
    normalized = s.replace(/\./g, '').replace(',', '.');
  } else if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) {
    // 1,234,567.89 — nghìn bằng dấu phẩy (chuẩn Anh/Mỹ)
    normalized = s.replace(/,/g, '');
  } else if (/^-?\d+,\d+$/.test(s)) {
    // 1,5 — thập phân kiểu VN
    normalized = s.replace(',', '.');
  } else {
    normalized = s;
  }

  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

/**
 * Số tiền của phiếu: ưu tiên giá trị nhập tay; bỏ trống thì suy từ số lượng × đơn giá.
 * Trả 0 khi không đủ dữ liệu (zod sẽ chặn vì phải > 0).
 */
export function tinhSoTien(
  soTien: number | null | undefined,
  soLuong: number | null | undefined,
  donGia: number | null | undefined
): number {
  if (soTien != null && soTien > 0) return soTien;
  if (soLuong != null && donGia != null) {
    const tich = soLuong * donGia;
    return Number.isFinite(tich) && tich > 0 ? tich : 0;
  }
  return soTien ?? 0;
}
