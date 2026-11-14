/** Tab Chi tiết: dòng fp_farm_ptc_nhat_ky_lan (embed phiếu cha `nk` + thuốc `hh`) → dòng phẳng. */
import { chuanHoaDonVi } from './constants';
import { parseSo } from './so';
import type { NhatKyPhunCuiLanRow } from './types';

export interface DbLanChiTiet {
  id: number | string;
  id_nhat_ky: number | string;
  thu_tu: number | string;
  gio: string | null;
  id_hang_hoa: number | string | null;
  nong_do: string | number | null;
  don_vi: string | null;
  luong_nuoc_lit: string | number | null;
  luong_thuoc: string | number | null;
  ghi_chu: string | null;
  hh?: { ma_hang_hoa: string | null; ten_hang_hoa: string | null } | null;
  nk?: {
    ngay: string;
    id_chi_nhanh: number | string;
    cn?: { ten_chi_nhanh: string | null } | null;
    nv?: { ho_va_ten: string | null } | null;
  } | null;
}

export function dongChiTietTuDb(r: DbLanChiTiet): NhatKyPhunCuiLanRow {
  return {
    id: String(r.id),
    id_nhat_ky: String(r.id_nhat_ky),
    ngay: r.nk?.ngay ?? '',
    id_chi_nhanh: r.nk?.id_chi_nhanh != null ? String(r.nk.id_chi_nhanh) : '',
    ten_chi_nhanh: r.nk?.cn?.ten_chi_nhanh ?? null,
    ten_nhan_vien_phu_trach: r.nk?.nv?.ho_va_ten ?? null,
    thu_tu: Number(r.thu_tu),
    // `07:00:00` → `07:00`
    gio: r.gio ? r.gio.slice(0, 5) : null,
    id_hang_hoa: r.id_hang_hoa != null ? String(r.id_hang_hoa) : null,
    ma_hang_hoa: r.hh?.ma_hang_hoa ?? null,
    ten_hang_hoa: r.hh?.ten_hang_hoa ?? null,
    nong_do: parseSo(r.nong_do),
    don_vi: chuanHoaDonVi(r.don_vi),
    luong_nuoc_lit: parseSo(r.luong_nuoc_lit),
    luong_thuoc: parseSo(r.luong_thuoc),
    ghi_chu: r.ghi_chu ?? null,
  };
}
