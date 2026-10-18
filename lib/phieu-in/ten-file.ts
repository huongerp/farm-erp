/**
 * Phần tên file tải về (PDF/DOC/XLSX) từ chữ tiếng Việt: bỏ dấu, `đ` → `d`, khoảng trắng → `_`,
 * bỏ ký tự lạ. Trước đây mỗi module tự lọc `[^\wÀ-ɏ]` — giữ được "ố" nhưng làm mất
 * hẳn "ấ", "ạ"… (ngoài dải) nên tên file ra "xut" thay vì "xuat".
 */
export function tenFileAnToan(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^\w-]/g, '');
}
