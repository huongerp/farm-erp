/**
 * Mọi giá trị lấy từ dữ liệu (tên nhân viên, ghi chú, thông tin công ty…) ghép vào chuỗi
 * HTML — bản in, xuất PDF/Doc qua innerHTML hay document.write — đều phải qua đây.
 * Thiếu bước này, một tên kiểu `<img src=x onerror=…>` sẽ chạy mã trong phiên người in.
 */
export function escapeHtml(value: unknown): string {
  if (value == null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
