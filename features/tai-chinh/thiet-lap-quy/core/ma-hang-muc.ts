/**
 * Sinh mã hạng mục từ tên — mã là khóa kỹ thuật (unique, dùng để khớp khi import
 * Excel), người dùng không phải nhập nên không hiện trên UI.
 * Thuần, test cạnh file.
 */

/** "Vật tư" → "VAT_TU", "Chi khác (2)" → "CHI_KHAC_2". */
export function slugMaHangMuc(ten: string): string {
  const base = (ten ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return base || 'HANG_MUC';
}

/**
 * Mã duy nhất: nếu mã sinh ra đã có trong `daDung` thì thêm hậu tố _2, _3…
 * `daDung` là tập mã đang tồn tại (không tính bản ghi đang sửa).
 */
export function maHangMucDuyNhat(ten: string, daDung: Iterable<string>): string {
  const used = new Set([...daDung].map((m) => m.toUpperCase()));
  const base = slugMaHangMuc(ten);
  if (!used.has(base)) return base;
  for (let i = 2; i < 1000; i += 1) {
    const candidate = `${base}_${i}`;
    if (!used.has(candidate)) return candidate;
  }
  return `${base}_${Date.now()}`;
}
