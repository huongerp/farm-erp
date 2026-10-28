/** Khoá ô cảnh báo «SL lỗi > số lượng» — ghép từ kết quả `kiemTraSoLuongLoi` (core/bang-tinh). */
export const khoaCanhBao = (idPhieuLo: string, idCot: string, ngay: string, sttDong: number) =>
  `${idPhieuLo}|${idCot}|${ngay}|${sttDong}`;
