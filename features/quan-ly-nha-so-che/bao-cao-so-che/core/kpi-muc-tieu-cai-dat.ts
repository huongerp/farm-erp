/**
 * Mục tiêu KPI theo farm × ngày hiệu lực — bảng `fp_var_bcsc_kpi_muc_tieu` (migration 103, super admin cài).
 * Phiếu ngày D của farm F dùng bản có `ap_dung_tu` lớn nhất ≤ D; không có bản nào → `null`
 * (form giữ mục tiêu nhập tay như cũ).
 */
import type { FarmBaoCaoKpiThuongRow } from '../../shared/kpi-thuong/types';
import { resolveBcscPresetKpiDerivedFields } from './bcsc-kpi';
import { computeBcscThuongTheoCongThuc } from './kpi-thuong-cong-thuc';
import { BCSC_KPI_THUONG_PRESETS } from './kpi-thuong-presets';

export interface KpiMucTieuCaiDatRow {
  id?: string | number;
  id_chi_nhanh: string | number;
  /** `yyyy-mm-dd` */
  ap_dung_tu: string;
  muc_tieu_nang_suat: number | string | null;
  muc_tieu_loi: number | string | null;
}

export interface KpiMucTieu {
  nangSuat: number | null;
  loi: number | null;
  /** Ngày hiệu lực của bản đang áp (`yyyy-mm-dd`). */
  apDungTu: string;
}

/** Số dòng preset được cài mục tiêu: 0 Năng suất sơ chế, 1 Tỷ lệ nải chuỗi lỗi. */
export const BCSC_SO_DONG_MUC_TIEU_CAI_DAT = 2;

const soHoacNull = (v: number | string | null | undefined): number | null => {
  if (v == null || v === '') return null;
  const n = Number(String(v).replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : null;
};

const ngayKey = (d: string | null | undefined) => String(d ?? '').slice(0, 10);

/** Các bản của một farm, sắp tăng dần theo ngày hiệu lực. */
export function banCaiDatCuaFarm(
  rows: KpiMucTieuCaiDatRow[] | null | undefined,
  idChiNhanh: string | number | null | undefined
): KpiMucTieuCaiDatRow[] {
  if (idChiNhanh == null || idChiNhanh === '') return [];
  const id = String(idChiNhanh);
  return (rows ?? [])
    .filter((r) => String(r.id_chi_nhanh) === id && ngayKey(r.ap_dung_tu) !== '')
    .sort((a, b) => ngayKey(a.ap_dung_tu).localeCompare(ngayKey(b.ap_dung_tu)));
}

/** Mục tiêu đang hiệu lực cho phiếu ngày `ngay` của farm; chưa có bản nào ≤ ngày → `null`. */
export function mucTieuKpiTheoNgay(
  rows: KpiMucTieuCaiDatRow[] | null | undefined,
  idChiNhanh: string | number | null | undefined,
  ngay: string | null | undefined
): KpiMucTieu | null {
  const d = ngayKey(ngay);
  if (!d) return null;
  let chon: KpiMucTieuCaiDatRow | null = null;
  for (const r of banCaiDatCuaFarm(rows, idChiNhanh)) {
    if (ngayKey(r.ap_dung_tu) <= d) chon = r;
    else break;
  }
  if (!chon) return null;
  return {
    nangSuat: soHoacNull(chon.muc_tieu_nang_suat),
    loi: soHoacNull(chon.muc_tieu_loi),
    apDungTu: ngayKey(chon.ap_dung_tu),
  };
}

/**
 * Khoảng ngày phiếu chịu ảnh hưởng khi lưu bản `apDungTu` cho farm: từ `apDungTu` đến TRƯỚC mốc kế tiếp
 * (đã có trong `rows`) của farm; không có mốc sau → `denTruoc = null` (tới nay).
 */
export function khoangApDung(
  rows: KpiMucTieuCaiDatRow[] | null | undefined,
  idChiNhanh: string | number,
  apDungTu: string
): { tu: string; denTruoc: string | null } {
  const tu = ngayKey(apDungTu);
  const sau = banCaiDatCuaFarm(rows, idChiNhanh).find((r) => ngayKey(r.ap_dung_tu) > tu);
  return { tu, denTruoc: sau ? ngayKey(sau.ap_dung_tu) : null };
}

export type DongKpiTinhLai = Pick<
  FarmBaoCaoKpiThuongRow,
  'muc_tieu' | 'phan_tram' | 'danh_gia' | 'thuong_ql' | 'thuong_nhom_tia' | 'thuong_nhom_cp'
>;

/**
 * Tính lại dòng preset `index` (0 Năng suất, 1 Lỗi) của phiếu ĐÃ LƯU theo mục tiêu mới, từ `thuc_te` đã lưu.
 * Dùng lại đúng công thức của form (`resolveBcscPresetKpiDerivedFields` + `computeBcscThuongTheoCongThuc`).
 * `mucTieu` null (bản không cài dòng này) hoặc dòng không phải preset được cài → `null` (không đụng).
 */
export function tinhLaiDongKpiPreset(
  row: Pick<FarmBaoCaoKpiThuongRow, 'ten_hang_muc' | 'thuc_te' | 'danh_gia'>,
  index: number,
  mucTieu: number | null
): DongKpiTinhLai | null {
  if (index < 0 || index >= BCSC_SO_DONG_MUC_TIEU_CAI_DAT || mucTieu == null) return null;
  if (row.ten_hang_muc?.trim() !== BCSC_KPI_THUONG_PRESETS[index].ten_hang_muc) return null;
  const tt = soThucTe(row.thuc_te);
  const d = resolveBcscPresetKpiDerivedFields(
    { thucTeValue: tt, isHigherBetter: index === 0, mucTieuCaiDat: mucTieu },
    null
  );
  const thuong = computeBcscThuongTheoCongThuc(index, d.tyLeDat);
  return {
    muc_tieu: d.mucTieuStr,
    phan_tram: d.phanTram,
    danh_gia: d.danhGia ?? row.danh_gia,
    thuong_ql: thuong.thuong_ql ?? 0,
    thuong_nhom_tia: thuong.thuong_nhom_tia ?? 0,
    thuong_nhom_cp: thuong.thuong_nhom_cp ?? 0,
  };
}

function soThucTe(v: string | null | undefined): number | null {
  if (v == null || String(v).trim() === '') return null;
  const n = Number(String(v).trim().replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}
