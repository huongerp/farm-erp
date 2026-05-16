import type { FarmDuBaoSlDongThung } from './types';
import type { DuBaoSlDongThungFormValues } from './schema';
import { computeDuBaoSlDongThungKpi, type DuBaoSlDongThungKpiInput } from './kpi';

export function defaultFormValues(): DuBaoSlDongThungFormValues {
  const today = new Date().toISOString().slice(0, 10);
  return {
    ngay: today,
    id_chi_nhanh: '',
    ten_chi_nhanh: null,
    so_buong_can_mau: 0,
    tong_can_nang_mau: 0,
    tong_buong_nhap_ke_hoach: 0,
    ty_le_thu_hoi_ke_hoach_pct: 0,
    quy_cach_dong_thung_ke_hoach: 0,
    tong_buong_nhap_thuc_te: 0,
    ty_le_thu_hoi_thuc_te_pct: 0,
    quy_cach_dong_thung_thuc_te: 0,
    ghi_chu: null,
  };
}

export function farmDuBaoSlDongThungToForm(row: FarmDuBaoSlDongThung): DuBaoSlDongThungFormValues {
  const pct = (r: number) => Math.round((Number(r) || 0) * 10000) / 100;
  return {
    ngay: row.ngay,
    id_chi_nhanh: row.id_chi_nhanh != null && String(row.id_chi_nhanh).trim() !== '' ? String(row.id_chi_nhanh) : '',
    ten_chi_nhanh: row.ten_chi_nhanh,
    so_buong_can_mau: Number(row.so_buong_can_mau) || 0,
    tong_can_nang_mau: Number(row.tong_can_nang_mau) || 0,
    tong_buong_nhap_ke_hoach: Number(row.tong_buong_nhap_ke_hoach) || 0,
    ty_le_thu_hoi_ke_hoach_pct: pct(row.ty_le_thu_hoi_ke_hoach),
    quy_cach_dong_thung_ke_hoach: Number(row.quy_cach_dong_thung_ke_hoach) || 0,
    tong_buong_nhap_thuc_te: Number(row.tong_buong_nhap_thuc_te) || 0,
    ty_le_thu_hoi_thuc_te_pct: pct(row.ty_le_thu_hoi_thuc_te),
    quy_cach_dong_thung_thuc_te: Number(row.quy_cach_dong_thung_thuc_te) || 0,
    ghi_chu: row.ghi_chu,
  };
}

export function formValuesToKpiInput(values: DuBaoSlDongThungFormValues): DuBaoSlDongThungKpiInput {
  const r = (pct: number) => Math.min(1, Math.max(0, (Number(pct) || 0) / 100));
  return {
    so_buong_can_mau: values.so_buong_can_mau,
    tong_can_nang_mau: values.tong_can_nang_mau,
    tong_buong_nhap_ke_hoach: values.tong_buong_nhap_ke_hoach,
    ty_le_thu_hoi_ke_hoach: r(values.ty_le_thu_hoi_ke_hoach_pct),
    quy_cach_dong_thung_ke_hoach: values.quy_cach_dong_thung_ke_hoach,
    tong_buong_nhap_thuc_te: values.tong_buong_nhap_thuc_te,
    ty_le_thu_hoi_thuc_te: r(values.ty_le_thu_hoi_thuc_te_pct),
    quy_cach_dong_thung_thuc_te: values.quy_cach_dong_thung_thuc_te,
  };
}

export function computeKpiFromForm(values: DuBaoSlDongThungFormValues) {
  return computeDuBaoSlDongThungKpi(formValuesToKpiInput(values));
}

export function getPreferredBranchFromUserLastRecords(
  items: FarmDuBaoSlDongThung[],
  userId: string | number | undefined
): { id_chi_nhanh: string; ten_chi_nhanh: string } | null {
  if (userId == null || userId === '') return null;
  const uid = String(userId);
  const mine = items
    .filter((r) => r.id_nguoi_tao === uid && r.id_chi_nhanh && r.ten_chi_nhanh)
    .sort((a, b) => new Date(b.tg_tao).getTime() - new Date(a.tg_tao).getTime());
  const first = mine[0];
  if (!first?.id_chi_nhanh || !first.ten_chi_nhanh) return null;
  return { id_chi_nhanh: first.id_chi_nhanh, ten_chi_nhanh: first.ten_chi_nhanh };
}
