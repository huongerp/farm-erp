/**
 * Luật thuần cho `GET /logo?url=…` (tải hộ logo công ty ở tên miền khác để bản in / PDF vẽ được
 * — host ngoài thường không gửi CORS, html2canvas không chụp được ảnh đó).
 *
 * Chống SSRF: CHỈ nhận đúng URL đang lưu ở `fp_var_tt_cong_ty.logo` (quản trị khai), không tải
 * URL tuỳ ý. Giới hạn thời gian, dung lượng, phải là ảnh.
 */

export const LOGO_TOI_DA_BYTE = 3 * 1024 * 1024;
export const LOGO_HET_GIO_MS = 8_000;

/** URL http(s) hợp lệ và trùng (sau khi bỏ khoảng trắng) một logo đang lưu. */
export function laUrlLogoDuocPhep(url: string, dsLogo: readonly (string | null | undefined)[]): boolean {
  const u = url.trim();
  if (!/^https?:\/\/[^\s]+$/i.test(u)) return false;
  try {
    new URL(u);
  } catch {
    return false;
  }
  return dsLogo.some((l) => typeof l === 'string' && l.trim() === u);
}

/** Kiểu nội dung ảnh (`image/png`…) hoặc null nếu không phải ảnh. */
export function kieuAnh(contentType: string | null | undefined): string | null {
  const kieu = (contentType ?? '').split(';')[0]?.trim().toLowerCase() ?? '';
  return /^image\/[a-z0-9.+-]+$/.test(kieu) ? kieu : null;
}
