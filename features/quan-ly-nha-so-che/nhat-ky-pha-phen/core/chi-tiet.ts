/** Tab Chi tiết: dòng fp_farm_pp_nhat_ky_lan (embed phiếu cha `nk`) → dòng phẳng. */
import { tinhChenhLech } from './dinh-muc';
import { parseSo } from './so';
import type { NhatKyPhaPhenLanRow } from './types';

export interface DbLanChiTiet {
  id: number | string;
  id_nhat_ky: number | string;
  lan: number | string;
  gio: string | null;
  so_kg: string | number | null;
  dinh_muc_kg: string | number | null;
  nk?: {
    ngay: string;
    id_chi_nhanh: number | string;
    cn?: { ten_chi_nhanh: string | null } | null;
    nv?: { ho_va_ten: string | null } | null;
  } | null;
}

export function dongChiTietTuDb(r: DbLanChiTiet): NhatKyPhaPhenLanRow {
  const soKg = parseSo(r.so_kg);
  const dinhMuc = parseSo(r.dinh_muc_kg);
  return {
    id: String(r.id),
    id_nhat_ky: String(r.id_nhat_ky),
    ngay: r.nk?.ngay ?? '',
    id_chi_nhanh: r.nk?.id_chi_nhanh != null ? String(r.nk.id_chi_nhanh) : '',
    ten_chi_nhanh: r.nk?.cn?.ten_chi_nhanh ?? null,
    ten_nhan_vien_phu_trach: r.nk?.nv?.ho_va_ten ?? null,
    lan: Number(r.lan),
    // `07:00:00` → `07:00`
    gio: r.gio ? r.gio.slice(0, 5) : null,
    so_kg: soKg,
    dinh_muc_kg: dinhMuc,
    chenh_lech: soKg != null && dinhMuc != null ? tinhChenhLech(soKg, dinhMuc) : null,
  };
}
