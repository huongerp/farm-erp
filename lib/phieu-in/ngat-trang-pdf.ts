/**
 * Chọn điểm ngắt trang cho PDF chụp từ ảnh: không cắt ngang dòng bảng, đoạn chữ hay khối
 * `break-inside: avoid` (ô ký, dòng tổng). Thuần, toạ độ cùng một đơn vị (px của bản dựng).
 */

export interface KhoiNguyen {
  top: number;
  bottom: number;
}

/** Trang ngắn hơn tỉ lệ này của trang đầy thì chịu cắt ngang còn hơn để trống nửa trang. */
const TI_LE_TRANG_TOI_THIEU = 0.4;

/**
 * Trả về các mốc [0, c1, c2, …, tongCao]: trang i là đoạn [moc[i], moc[i+1]).
 * Khối cao hơn một trang thì không giữ nguyên được — bỏ qua, cắt ngay giới hạn trang.
 */
export function chonDiemNgatTrang(tongCao: number, caoTrang: number, khoi: KhoiNguyen[]): number[] {
  if (!(caoTrang > 0) || !(tongCao > 0)) return [0, Math.max(0, tongCao)];
  const giu = khoi.filter((k) => k.bottom > k.top && k.bottom - k.top < caoTrang);
  // Mép trên của khối là chỗ cắt "sạch" (khối bắt đầu ở trang sau).
  const ungVien = Array.from(new Set(giu.map((k) => k.top))).sort((a, b) => a - b);
  const catNgang = (c: number) => giu.some((k) => k.top < c && c < k.bottom);

  const moc = [0];
  let dau = 0;
  // Sai số làm tròn (≤ 1px) không sinh trang trắng.
  while (tongCao - dau > caoTrang + 1) {
    const gioiHan = dau + caoTrang;
    let cat = gioiHan;
    if (catNgang(gioiHan)) {
      const san = dau + caoTrang * TI_LE_TRANG_TOI_THIEU;
      for (let i = ungVien.length - 1; i >= 0; i--) {
        const c = ungVien[i];
        if (c > gioiHan) continue;
        if (c <= san) break;
        if (!catNgang(c)) {
          cat = c;
          break;
        }
      }
    }
    moc.push(cat);
    dau = cat;
  }
  moc.push(tongCao);
  return moc;
}
