import type { FarmBaoCaoKpiThuongRow, KpiThuongFormRow } from './types';

export function defaultKpiThuongFormRow(): KpiThuongFormRow {
  return {
    ten_hang_muc: '',
    don_vi_tinh: null,
    muc_tieu: null,
    thuc_te: null,
    phan_tram: null,
    danh_gia: null,
    tien_thuong: 0,
    ghi_chu: null,
  };
}

export function kpiThuongRowsToForm(rows: FarmBaoCaoKpiThuongRow[]): KpiThuongFormRow[] {
  return (rows ?? []).map((k) => ({
    ten_hang_muc: k.ten_hang_muc ?? '',
    don_vi_tinh: k.don_vi_tinh ?? null,
    muc_tieu: k.muc_tieu ?? null,
    thuc_te: k.thuc_te ?? null,
    phan_tram: k.phan_tram == null || Number.isNaN(Number(k.phan_tram)) ? null : Number(k.phan_tram),
    danh_gia: k.danh_gia ?? null,
    tien_thuong: Number(k.tien_thuong ?? 0),
    ghi_chu: k.ghi_chu ?? null,
  }));
}
