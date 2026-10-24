/** Kỳ lương/điểm hiển thị cho người dùng: mm/yyyy (vd 5, 2026 → "05/2026"). */
export const formatKyThangNam = (nam: number, thang: number): string =>
  `${String(thang).padStart(2, '0')}/${nam}`;
