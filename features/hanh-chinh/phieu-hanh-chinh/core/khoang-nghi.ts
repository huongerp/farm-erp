/**
 * Khoảng thời gian của phiếu hành chính: "từ ngày (buổi) → đến ngày (buổi)".
 *
 * Mỗi đầu khoảng có ngày + buổi (mô hình Lark/Personio): bắt đầu nghỉ TỪ buổi
 * nào, nghỉ HẾT buổi nào. Nhờ vậy nhập được ca "chiều hôm nay → sáng hôm sau"
 * mà mô hình "1 ngày + ca" cũ không làm được.
 *
 * Số ngày không lưu ở DB — luôn tính lại từ 4 trường ở đây để không lệch khi
 * có người sửa SQL tay.
 */
import type { AdminFormType } from '../../thiet-lap-cong-luong/core/constants';
import type { AdminFormShift } from './constants';

export const ADMIN_FORM_SESSIONS = ['morning', 'afternoon'] as const;
export type AdminFormSession = typeof ADMIN_FORM_SESSIONS[number];

export interface KhoangPhieu {
  /** yyyy-mm-dd */
  tu_ngay: string;
  tu_buoi: AdminFormSession;
  /** yyyy-mm-dd */
  den_ngay: string;
  den_buoi: AdminFormSession;
}

/** Loại phiếu nhập theo khoảng (và trừ Chủ nhật khi đếm). Các loại khác: 1 ngày + ca. */
export const LOAI_PHIEU_THEO_KHOANG: ReadonlySet<AdminFormType> = new Set<AdminFormType>([
  'leave_paid',
  'leave_unpaid',
  'business_trip',
]);

export const laLoaiTheoKhoang = (loai: AdminFormType | '' | null | undefined): boolean =>
  !!loai && LOAI_PHIEU_THEO_KHOANG.has(loai);

const NGAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const MS_NGAY = 86_400_000;

function toUtc(ngay: string): number | null {
  if (!NGAY_RE.test(ngay)) return null;
  const [y, m, d] = ngay.split('-').map(Number);
  const ms = Date.UTC(y, m - 1, d);
  const back = new Date(ms);
  if (back.getUTCFullYear() !== y || back.getUTCMonth() !== m - 1 || back.getUTCDate() !== d) return null;
  return ms;
}

const fromUtc = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/** Thứ tự nửa ngày trên trục thời gian: sáng = 2k, chiều = 2k+1. */
function nuaNgay(ngayMs: number, buoi: AdminFormSession): number {
  return (ngayMs / MS_NGAY) * 2 + (buoi === 'afternoon' ? 1 : 0);
}

export type LoiKhoang = 'ngay_khong_hop_le' | 'den_truoc_tu' | 'chi_chu_nhat';

/** null = hợp lệ. `truChuNhat` để bắt khoảng chỉ gồm Chủ nhật (0 ngày). */
export function kiemTraKhoang(k: KhoangPhieu, truChuNhat = true): LoiKhoang | null {
  const tu = toUtc(k.tu_ngay);
  const den = toUtc(k.den_ngay);
  if (tu == null || den == null) return 'ngay_khong_hop_le';
  if (nuaNgay(den, k.den_buoi) < nuaNgay(tu, k.tu_buoi)) return 'den_truoc_tu';
  if (tinhSoNgay(k, truChuNhat) === 0) return 'chi_chu_nhat';
  return null;
}

export interface NgayTrongKhoang {
  ngay: string;
  /** 1 hoặc 0,5 */
  soNgay: number;
}

/**
 * Từng ngày tính công nghỉ trong khoảng. Ngày đầu bắt đầu buổi chiều trừ 0,5;
 * ngày cuối kết thúc buổi sáng trừ 0,5; Chủ nhật bỏ qua khi `truChuNhat`.
 * Khoảng không hợp lệ trả mảng rỗng.
 */
export function duyetTungNgay(k: KhoangPhieu, truChuNhat: boolean): NgayTrongKhoang[] {
  const tu = toUtc(k.tu_ngay);
  const den = toUtc(k.den_ngay);
  if (tu == null || den == null || nuaNgay(den, k.den_buoi) < nuaNgay(tu, k.tu_buoi)) return [];
  const out: NgayTrongKhoang[] = [];
  for (let ms = tu; ms <= den; ms += MS_NGAY) {
    if (truChuNhat && new Date(ms).getUTCDay() === 0) continue;
    let so = 1;
    if (ms === tu && k.tu_buoi === 'afternoon') so -= 0.5;
    if (ms === den && k.den_buoi === 'morning') so -= 0.5;
    if (so > 0) out.push({ ngay: fromUtc(ms), soNgay: so });
  }
  return out;
}

export function tinhSoNgay(k: KhoangPhieu, truChuNhat: boolean): number {
  return duyetTungNgay(k, truChuNhat).reduce((s, d) => s + d.soNgay, 0);
}

/** Số Chủ nhật nằm trong khoảng — để dòng tổng ghi rõ "đã trừ N Chủ nhật". */
export function demChuNhat(k: KhoangPhieu): number {
  return duyetTungNgay(k, false).filter((d) => new Date(`${d.ngay}T00:00:00Z`).getUTCDay() === 0).length;
}

/** Phần của khoảng rơi vào tháng `yyyy-mm` — định mức tính theo tháng, phiếu có thể vắt qua tháng. */
export function soNgayTrongThang(k: KhoangPhieu, thang: string, truChuNhat: boolean): number {
  const prefix = `${thang}-`;
  return duyetTungNgay(k, truChuNhat)
    .filter((d) => d.ngay.startsWith(prefix))
    .reduce((s, d) => s + d.soNgay, 0);
}

/** Hai khoảng có chung ít nhất một nửa ngày không. */
export function giaoNhau(a: KhoangPhieu, b: KhoangPhieu): boolean {
  const aTu = toUtc(a.tu_ngay);
  const aDen = toUtc(a.den_ngay);
  const bTu = toUtc(b.tu_ngay);
  const bDen = toUtc(b.den_ngay);
  if (aTu == null || aDen == null || bTu == null || bDen == null) return false;
  return (
    nuaNgay(aTu, a.tu_buoi) <= nuaNgay(bDen, b.den_buoi) &&
    nuaNgay(bTu, b.tu_buoi) <= nuaNgay(aDen, a.den_buoi)
  );
}

/** Loại 1 ngày: ca → khoảng trong cùng ngày. */
export function khoangTuCa(ngay: string, ca: AdminFormShift): KhoangPhieu {
  return {
    tu_ngay: ngay,
    den_ngay: ngay,
    tu_buoi: ca === 'afternoon' ? 'afternoon' : 'morning',
    den_buoi: ca === 'morning' ? 'morning' : 'afternoon',
  };
}

/** Khoảng trong cùng ngày → ca; khoảng nhiều ngày → null (cột `ca` để trống). */
export function caTuKhoang(k: KhoangPhieu): AdminFormShift | null {
  if (k.tu_ngay !== k.den_ngay) return null;
  if (k.tu_buoi === 'morning' && k.den_buoi === 'morning') return 'morning';
  if (k.tu_buoi === 'afternoon' && k.den_buoi === 'afternoon') return 'afternoon';
  return 'full';
}

/** Ngày cuối tối thiểu khi đổi "Từ ngày": đến ngày không được đứng trước từ ngày. */
export function chinhDenNgay(tuNgay: string, denNgay: string): string {
  const tu = toUtc(tuNgay);
  const den = toUtc(denNgay);
  if (tu == null) return denNgay;
  if (den == null || den < tu) return tuNgay;
  return denNgay;
}

/** Dữ liệu tối thiểu của một phiếu để tính khoảng + số ngày. */
export interface PhieuCoKhoang {
  loai_phieu: AdminFormType;
  ngay: string;
  den_ngay: string;
  tu_buoi: AdminFormSession;
  den_buoi: AdminFormSession;
}

export const khoangCuaPhieu = (p: PhieuCoKhoang): KhoangPhieu => ({
  tu_ngay: p.ngay,
  tu_buoi: p.tu_buoi,
  den_ngay: p.den_ngay || p.ngay,
  den_buoi: p.den_buoi,
});

/** Số ngày của phiếu — chỉ loại nghỉ / công tác trừ Chủ nhật (tăng ca Chủ nhật là có thật). */
export const soNgayCuaPhieu = (p: PhieuCoKhoang): number =>
  tinhSoNgay(khoangCuaPhieu(p), laLoaiTheoKhoang(p.loai_phieu));

export const soNgayCuaPhieuTrongThang = (p: PhieuCoKhoang, thang: string): number =>
  soNgayTrongThang(khoangCuaPhieu(p), thang, laLoaiTheoKhoang(p.loai_phieu));

/**
 * Khoảng sẽ lưu từ dữ liệu form: loại theo khoảng lấy thẳng 4 trường, loại
 * 1 ngày suy từ ngày + ca (các trường khoảng trên form bị bỏ qua).
 */
export function khoangTuForm(v: {
  loai_phieu: AdminFormType | '';
  ngay: string;
  den_ngay: string;
  tu_buoi: AdminFormSession;
  den_buoi: AdminFormSession;
  ca: AdminFormShift;
}): KhoangPhieu {
  if (!laLoaiTheoKhoang(v.loai_phieu)) return khoangTuCa(v.ngay, v.ca);
  return { tu_ngay: v.ngay, tu_buoi: v.tu_buoi, den_ngay: v.den_ngay || v.ngay, den_buoi: v.den_buoi };
}
