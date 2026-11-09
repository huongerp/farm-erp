/**
 * Tổng hợp dòng phiếu checklist: đếm Đạt/K.Đạt, kiểm điều kiện Chuyển / Nhận (khớp RPC
 * rpc_cl_chuyen / rpc_cl_nhan migration 073), nhóm dòng theo mục để hiển thị / in.
 */
import type { DongPhieuChecklist, KetLuanVanHanh } from './types';

export type CotKetQua = 'kq_thuc_hien' | 'kq_kiem_tra';

export interface DemKetQua {
  tong: number;
  dat: number;
  khongDat: number;
  chuaTich: number;
}

type DongKq = Pick<DongPhieuChecklist, 'kq_thuc_hien' | 'kq_kiem_tra' | 'tinh_trang_khac_phuc'>;

export function demKetQua(dong: readonly DongKq[], cot: CotKetQua): DemKetQua {
  let dat = 0;
  let khongDat = 0;
  for (const d of dong) {
    if (d[cot] === 'dat') dat++;
    else if (d[cot] === 'khong_dat') khongDat++;
  }
  return { tong: dong.length, dat, khongDat, chuaTich: dong.length - dat - khongDat };
}

function trong(s: string | null | undefined): boolean {
  return (s ?? '').trim() === '';
}

export type LoiChuyen =
  | { loai: 'thieu_tich'; so: number }
  | { loai: 'thieu_khac_phuc'; so: number }
  | { loai: 'thieu_ket_luan' };

/** Lỗi chặn nút Chuyển; rỗng = chuyển được. */
export function loiTruocKhiChuyen(
  dong: readonly DongKq[],
  phieu: { co_ket_luan_van_hanh: boolean; ket_luan: KetLuanVanHanh | null }
): LoiChuyen[] {
  const loi: LoiChuyen[] = [];
  const { chuaTich } = demKetQua(dong, 'kq_thuc_hien');
  if (chuaTich > 0) loi.push({ loai: 'thieu_tich', so: chuaTich });
  const thieuKp = dong.filter((d) => d.kq_thuc_hien === 'khong_dat' && trong(d.tinh_trang_khac_phuc)).length;
  if (thieuKp > 0) loi.push({ loai: 'thieu_khac_phuc', so: thieuKp });
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
