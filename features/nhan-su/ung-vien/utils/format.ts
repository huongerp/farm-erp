/**
 * Lấy năm từ chuỗi ngày (ISO hoặc DD/MM/YYYY).
 */
export function getYearFromNgaySinh(ngaySinh: string | null | undefined): number | null {
  if (!ngaySinh || typeof ngaySinh !== 'string') return null;
  const trimmed = ngaySinh.trim();
  if (!trimmed) return null;
  // ISO: YYYY-MM-DD
  const isoMatch = trimmed.match(/^(\d{4})-/);
  if (isoMatch) return parseInt(isoMatch[1], 10);
  // DD/MM/YYYY
  const dmyMatch = trimmed.match(/\/(\d{4})$/);
  if (dmyMatch) return parseInt(dmyMatch[1], 10);
  // Chỉ có năm
  const yMatch = trimmed.match(/^\d{4}$/);
  if (yMatch) return parseInt(trimmed, 10);
  return null;
}
