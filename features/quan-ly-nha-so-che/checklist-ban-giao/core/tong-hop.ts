/**
 * Tổng hợp dòng phiếu checklist: đếm Đạt/K.Đạt, kiểm điều kiện Chuyển / Nhận (khớp RPC
 * rpc_cl_chuyen / rpc_cl_nhan migration 073), nhóm dòng theo mục để hiển thị / in.
 * Cờ «từng Không đạt» (migration 076): lỗi đã sửa rồi đổi sang Đạt vẫn hiện lên bảng / bản in.
 */
import type { DongPhieuChecklist, KetLuanVanHanh } from './types';

function trong(s: string | null | undefined): boolean {
  return (s ?? '').trim() === '';
}

export type CotKetQua = 'kq_thuc_hien' | 'kq_kiem_tra';

export interface DemKetQua {
  tong: number;
  dat: number;
  khongDat: number;
  chuaTich: number;
  /** Đang Đạt nhưng từng tích Không đạt (cờ DB, migration 076) — vẫn là lỗi phải báo văn phòng. */
  tungKhongDat: number;
  /** Lỗi (Không đạt hoặc từng Không đạt) đã ghi tình trạng khắc phục — chỉ tính cột khâu làm. */
  daKhacPhuc: number;
}

type DongKq = Pick<DongPhieuChecklist, 'kq_thuc_hien' | 'kq_kiem_tra' | 'tinh_trang_khac_phuc'> &
  Partial<Pick<DongPhieuChecklist, 'qlx_tung_khong_dat' | 'gs_tung_khong_dat' | 'stt'>>;

/** Cờ «từng Không đạt» của một cột. */
export function tungKhongDat(d: DongKq, cot: CotKetQua): boolean {
  return (cot === 'kq_thuc_hien' ? d.qlx_tung_khong_dat : d.gs_tung_khong_dat) === true;
}

/** Dòng có lỗi ở cột: đang Không đạt, hoặc từng Không đạt rồi được đổi sang Đạt. */
export function laLoi(d: DongKq, cot: CotKetQua): boolean {
  return d[cot] === 'khong_dat' || (d[cot] === 'dat' && tungKhongDat(d, cot));
}

export function demKetQua(dong: readonly DongKq[], cot: CotKetQua): DemKetQua {
  let dat = 0;
  let khongDat = 0;
  let tung = 0;
  let daKp = 0;
  for (const d of dong) {
    if (d[cot] === 'dat') {
      dat++;
      if (tungKhongDat(d, cot)) tung++;
    } else if (d[cot] === 'khong_dat') khongDat++;
    if (cot === 'kq_thuc_hien' && laLoi(d, cot) && !trong(d.tinh_trang_khac_phuc)) daKp++;
  }
  return {
    tong: dong.length,
    dat,
    khongDat,
    chuaTich: dong.length - dat - khongDat,
    tungKhongDat: tung,
    daKhacPhuc: daKp,
  };
}

/** Ký hiệu ô kết quả trên bản in: ✗ / ✗→✓ (từng Không đạt, đã sửa) / ✓ / trống. */
export function kyHieuKetQua(d: DongKq, cot: CotKetQua): string {
  const v = d[cot];
  if (v === 'khong_dat') return '✗';
  if (v === 'dat') return tungKhongDat(d, cot) ? '✗→✓' : '✓';
  return '';
}

export type LoiChuyen =
  | { loai: 'thieu_tich'; so: number }
  | { loai: 'thieu_khac_phuc'; so: number; stt: number[] }
  | { loai: 'thieu_ket_luan' };

/** Lỗi chặn nút Chuyển; rỗng = chuyển được. */
export function loiTruocKhiChuyen(
  dong: readonly DongKq[],
  phieu: { co_ket_luan_van_hanh: boolean; ket_luan: KetLuanVanHanh | null }
): LoiChuyen[] {
  const loi: LoiChuyen[] = [];
  const { chuaTich } = demKetQua(dong, 'kq_thuc_hien');
  if (chuaTich > 0) loi.push({ loai: 'thieu_tich', so: chuaTich });
  const thieuKp = dong.filter((d) => d.kq_thuc_hien === 'khong_dat' && trong(d.tinh_trang_khac_phuc));
  if (thieuKp.length > 0) {
    loi.push({ loai: 'thieu_khac_phuc', so: thieuKp.length, stt: thieuKp.map((d) => d.stt ?? 0).filter((n) => n > 0) });
  }
  if (phieu.co_ket_luan_van_hanh && phieu.ket_luan == null) loi.push({ loai: 'thieu_ket_luan' });
  return loi;
}

/** Số dòng khâu sau chưa kiểm tra; 0 = bấm Nhận được. */
export function soDongChuaKiemTra(dong: readonly DongKq[]): number {
  return demKetQua(dong, 'kq_kiem_tra').chuaTich;
}

/** Dòng khâu sau đánh khác khâu làm (khâu sau phát hiện lỗi khâu trước bỏ sót). */
export function laDongLech(d: DongKq): boolean {
  return d.kq_thuc_hien != null && d.kq_kiem_tra != null && d.kq_thuc_hien !== d.kq_kiem_tra;
}

export interface NhomMuc<T> {
  tenMuc: string | null;
  thuTuMuc: number;
  dong: T[];
}

/** Nhóm dòng theo mục (giữ thứ tự thu_tu_muc rồi stt). */
export function nhomTheoMuc<T extends Pick<DongPhieuChecklist, 'ten_muc' | 'thu_tu_muc' | 'stt'>>(
  dong: readonly T[]
): NhomMuc<T>[] {
  const sapXep = [...dong].sort((a, b) => a.thu_tu_muc - b.thu_tu_muc || a.stt - b.stt);
  const nhom: NhomMuc<T>[] = [];
  for (const d of sapXep) {
    const cuoi = nhom[nhom.length - 1];
    if (cuoi && cuoi.thuTuMuc === d.thu_tu_muc && cuoi.tenMuc === d.ten_muc) cuoi.dong.push(d);
    else nhom.push({ tenMuc: d.ten_muc, thuTuMuc: d.thu_tu_muc, dong: [d] });
  }
  return nhom;
}
