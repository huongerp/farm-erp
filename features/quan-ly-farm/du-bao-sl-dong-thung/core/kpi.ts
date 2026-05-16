import type { FarmDuBaoSlDongThung } from './types';

/** Đầu vào số (tỷ lệ thu hồi dạng 0–1). */
export interface DuBaoSlDongThungKpiInput {
  so_buong_can_mau: number;
  tong_can_nang_mau: number;
  tong_buong_nhap_ke_hoach: number;
  ty_le_thu_hoi_ke_hoach: number;
  quy_cach_dong_thung_ke_hoach: number;
  tong_buong_nhap_thuc_te: number;
  ty_le_thu_hoi_thuc_te: number;
  quy_cach_dong_thung_thuc_te: number;
}

export interface DuBaoSlDongThungKpi {
  can_nang_binh_quan_buong: number | null;
  tong_khoi_luong_ke_hoach: number;
  khoi_luong_dong_thung_ke_hoach: number;
  tong_so_thung_ke_hoach: number;
  tong_khoi_luong_thuc_te: number;
  khoi_luong_dong_thung_thuc_te: number;
  tong_so_thung_thuc_te: number;
}

function safeDiv(a: number, b: number): number {
  if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) return 0;
  return a / b;
}

function roundBoxes(packingKg: number, kgPerBox: number): number {
  if (!Number.isFinite(packingKg) || !Number.isFinite(kgPerBox) || kgPerBox <= 0) return 0;
  return Math.round(packingKg / kgPerBox);
}

export function computeDuBaoSlDongThungKpiFromFarm(row: FarmDuBaoSlDongThung): DuBaoSlDongThungKpi {
  return computeDuBaoSlDongThungKpi({
    so_buong_can_mau: row.so_buong_can_mau,
    tong_can_nang_mau: row.tong_can_nang_mau,
    tong_buong_nhap_ke_hoach: row.tong_buong_nhap_ke_hoach,
    ty_le_thu_hoi_ke_hoach: row.ty_le_thu_hoi_ke_hoach,
    quy_cach_dong_thung_ke_hoach: row.quy_cach_dong_thung_ke_hoach,
    tong_buong_nhap_thuc_te: row.tong_buong_nhap_thuc_te,
    ty_le_thu_hoi_thuc_te: row.ty_le_thu_hoi_thuc_te,
    quy_cach_dong_thung_thuc_te: row.quy_cach_dong_thung_thuc_te,
  });
}

export function computeDuBaoSlDongThungKpi(v: DuBaoSlDongThungKpiInput): DuBaoSlDongThungKpi {
  const n = Math.max(0, Math.floor(Number(v.so_buong_can_mau) || 0));
  const w = Number(v.tong_can_nang_mau) || 0;
  const canBQ = n > 0 ? safeDiv(w, n) : null;

  const b4 = Math.max(0, Math.floor(Number(v.tong_buong_nhap_ke_hoach) || 0));
  const r6 = Math.min(1, Math.max(0, Number(v.ty_le_thu_hoi_ke_hoach) || 0));
  const s8 = Math.max(0, Number(v.quy_cach_dong_thung_ke_hoach) || 0);

  const b10 = Math.max(0, Math.floor(Number(v.tong_buong_nhap_thuc_te) || 0));
  const r12 = Math.min(1, Math.max(0, Number(v.ty_le_thu_hoi_thuc_te) || 0));
  const s14 = Math.max(0, Number(v.quy_cach_dong_thung_thuc_te) || 0);

  const tongKlKh = canBQ != null ? canBQ * b4 : 0;
  const dongThungKh = tongKlKh * r6;
  const thungKh = roundBoxes(dongThungKh, s8);

  const tongKlTt = canBQ != null ? canBQ * b10 : 0;
  const dongThungTt = tongKlTt * r12;
  const thungTt = roundBoxes(dongThungTt, s14);

  return {
    can_nang_binh_quan_buong: canBQ,
    tong_khoi_luong_ke_hoach: tongKlKh,
    khoi_luong_dong_thung_ke_hoach: dongThungKh,
    tong_so_thung_ke_hoach: thungKh,
    tong_khoi_luong_thuc_te: tongKlTt,
    khoi_luong_dong_thung_thuc_te: dongThungTt,
    tong_so_thung_thuc_te: thungTt,
  };
}
