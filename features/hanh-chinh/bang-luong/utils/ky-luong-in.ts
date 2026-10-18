/** Kỳ lương cho bản in / tên trang: { thang: "10", nam: 2026 } → "Tháng 10/2026" qua i18n. */
export function kyLuongIn(thang: number, nam: number): { thang: string; nam: number } {
  return { thang: String(thang).padStart(2, '0'), nam };
}
