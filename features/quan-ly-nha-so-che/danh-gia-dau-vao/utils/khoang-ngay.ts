/** Chọn nhanh khoảng ngày cho Bảng đánh giá + danh sách tuần ISO phủ khoảng đó (thuần). */
import { cacNgayTrongKhoang, congNgay, ngayDauTuanIso, tuanIsoCuaNgay, tuanKeTiep } from '../core/tuan';
import type { TuanIso } from '../core/types';

export type KieuKhoangNhanh = 'hom-nay' | 'tuan-nay' | 'tuan-truoc';

/** Khoảng tối đa một lần xem / in (mỗi ngày một khối lưới — quá dài thì nặng trình duyệt). */
export const SO_NGAY_TOI_DA = 31;

export function khoangNhanh(kieu: KieuKhoangNhanh, homNay: string): { tu: string; den: string } {
  if (kieu === 'hom-nay') return { tu: homNay, den: homNay };
  const t = kieu === 'tuan-nay' ? tuanIsoCuaNgay(homNay) : tuanKeTiep(tuanIsoCuaNgay(homNay), -1);
  const dau = ngayDauTuanIso(t.nam, t.tuan);
  return { tu: dau, den: congNgay(dau, 6) };
}

/** Khoảng đang chọn khớp kiểu chọn nhanh nào (để tô nút), không khớp → null. */
export function kieuCuaKhoang(tu: string, den: string, homNay: string): KieuKhoangNhanh | null {
  for (const k of ['hom-nay', 'tuan-nay', 'tuan-truoc'] as const) {
    const x = khoangNhanh(k, homNay);
    if (x.tu === tu && x.den === den) return k;
  }
  return null;
}

/** Chuẩn hoá khoảng: đảo nếu ngược, cắt còn `SO_NGAY_TOI_DA` ngày tính từ `tu`. */
export function chuanHoaKhoang(tu: string, den: string): { tu: string; den: string; biCat: boolean } {
  const [a, b] = den < tu ? [den, tu] : [tu, den];
  const maxDen = congNgay(a, SO_NGAY_TOI_DA - 1);
  return b > maxDen ? { tu: a, den: maxDen, biCat: true } : { tu: a, den: b, biCat: false };
}

/** Các tuần ISO (không trùng, theo thứ tự) chứa ít nhất một ngày trong khoảng. */
export function cacTuanTrongKhoang(tu: string, den: string): TuanIso[] {
  const kq: TuanIso[] = [];
  for (const ngay of cacNgayTrongKhoang(tu, den)) {
    const t = tuanIsoCuaNgay(ngay);
    if (!kq.some((x) => x.nam === t.nam && x.tuan === t.tuan)) kq.push(t);
  }
  return kq;
}
