/**
 * Tải một Blob xuống máy qua link ẩn.
 * Bắt buộc appendChild trước khi click rồi remove sau — thiếu appendChild khiến
 * Firefox/Safari không kích hoạt được download (chỉ Chrome cho phép click() trên
 * <a> chưa gắn vào DOM).
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
