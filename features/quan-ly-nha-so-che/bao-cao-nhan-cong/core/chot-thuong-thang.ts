/**
 * Chốt thưởng vượt thùng tháng (migration 089): đổi bảng tháng tính sống ↔ ảnh chụp lưu DB.
 * Tháng đã chốt hiển thị / in từ ảnh chụp, không tính lại từ phiếu + cài đặt hiện tại.
 */
import { CHUYEN_PRODUCTION_CODES, type LoaiChuyen } from './types';
import type { DongThuongThang, NgayThuongVuot } from './thuong-vuot-thung';

/** Một dòng gửi `rpc_bcnc_chot_thang` (p_dong) — cũng là cột của `fp_farm_bcnc_chot_thang_ct`. */
export interface DongChotPayload {
  khoa_nv: string;
  id_nhan_vien: string | null;
  ho_ten: string;
  vi_tri: string | null;
  chuyen: LoaiChuyen[];
  so_ngay: number;
  gio_cong: number;
  thung_vuot: number;
  tien_truoc_ki: number;
  ki: number;
  tien: number;
  chi_tiet_ngay: NgayThuongVuot[];
}

/** Dòng ảnh chụp đọc từ DB (numeric của PostgREST có thể về dạng chuỗi). */
export interface DongChotDb {
  khoa_nv: string;
  id_nhan_vien: number | string | null;
  ho_ten: string;
  vi_tri: string | null;
  chuyen: string[] | null;
  so_ngay: number | string;
  gio_cong: number | string;
  thung_vuot: number | string;
  tien_truoc_ki: number | string;
  ki: number | string;
  tien: number | string;
  chi_tiet_ngay: unknown;
  thu_tu?: number;
}

const lam2 = (n: number) => Math.round(n * 100) / 100;
const so = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/** Bảng tháng → payload chốt (giữ thứ tự hiển thị; giờ / thùng 2 số lẻ, tiền làm tròn đồng). */
export function dongChotTuThuongThang(ds: readonly DongThuongThang[]): DongChotPayload[] {
  return ds.map((d) => ({
    khoa_nv: d.khoa,
    id_nhan_vien: d.id_nhan_vien,
    ho_ten: d.ho_ten,
    vi_tri: d.vi_tri,
    chuyen: [...d.chuyen],
    so_ngay: d.soNgay,
    gio_cong: lam2(d.gioCong),
    thung_vuot: lam2(d.thungVuotQuyDoi),
    tien_truoc_ki: Math.round(d.tienTruocKi),
    ki: d.ki,
    tien: d.tien,
    chi_tiet_ngay: d.ngay.map((n) => ({ ...n, gioCong: lam2(n.gioCong), thungVuotQuyDoi: lam2(n.thungVuotQuyDoi), tien: lam2(n.tien) })),
  }));
}

const LOAI_CHUYEN = new Set<string>(CHUYEN_PRODUCTION_CODES);

function docNgay(v: unknown): NgayThuongVuot[] {
  if (!Array.isArray(v)) return [];
  return v.flatMap((raw) => {
    const r = raw as Partial<Record<keyof NgayThuongVuot, unknown>> | null;
    if (!r || typeof r.ngay !== 'string' || !LOAI_CHUYEN.has(String(r.loai_chuyen))) return [];
    return [
      {
        ngay: r.ngay,
        loai_chuyen: r.loai_chuyen as LoaiChuyen,
        soNhom: so(r.soNhom),
        gioCong: so(r.gioCong),
        thungVuotQuyDoi: so(r.thungVuotQuyDoi),
        tien: so(r.tien),
      },
    ];
  });
}

/** Ảnh chụp DB → dòng hiển thị cùng kiểu với bảng tính sống (theo `thu_tu`). */
export function dongThuongTuChot(rows: readonly DongChotDb[]): DongThuongThang[] {
  return [...rows]
    .sort((a, b) => (a.thu_tu ?? 0) - (b.thu_tu ?? 0))
    .map((r) => ({
      khoa: r.khoa_nv,
      ho_ten: r.ho_ten,
      id_nhan_vien: r.id_nhan_vien != null && String(r.id_nhan_vien) !== '' ? String(r.id_nhan_vien) : null,
      vi_tri: r.vi_tri,
      chuyen: (r.chuyen ?? []).filter((c): c is LoaiChuyen => LOAI_CHUYEN.has(c)),
      soNgay: so(r.so_ngay),
      gioCong: so(r.gio_cong),
      thungVuotQuyDoi: so(r.thung_vuot),
      tienTruocKi: so(r.tien_truoc_ki),
      ki: r.ki == null || r.ki === '' ? 1 : so(r.ki),
      tien: so(r.tien),
      ngay: docNgay(r.chi_tiet_ngay),
    }));
}

/** Tổng của bảng tháng (dòng tổng trên tab / bản in / hộp xác nhận chốt). */
export function tongThuongThang(ds: readonly DongThuongThang[]) {
  return ds.reduce(
    (s, d) => ({ gio: s.gio + d.gioCong, thung: s.thung + d.thungVuotQuyDoi, truocKi: s.truocKi + d.tienTruocKi, tien: s.tien + d.tien }),
    { gio: 0, thung: 0, truocKi: 0, tien: 0 }
  );
}
