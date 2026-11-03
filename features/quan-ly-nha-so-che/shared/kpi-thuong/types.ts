/** Đánh giá KPI / thưởng — `phan_tram` thang 0–100 (85 = 85%), null nếu không áp dụng */
export interface FarmBaoCaoKpiThuongRow {
  id: string;
  id_bao_cao: string;
  thu_tu: number;
  ten_hang_muc: string;
  don_vi_tinh: string | null;
  muc_tieu: string | null;
  thuc_te: string | null;
  phan_tram: number | null;
  danh_gia: string | null;
  tien_thuong: number;
  /** Thưởng QL / nhóm tỉa / nhóm CP — nhập tay, độc lập với `tien_thuong` (migration 064) */
  thuong_ql: number;
  thuong_nhom_tia: number;
  thuong_nhom_cp: number;
  ghi_chu: string | null;
}

/** 3 cột thưởng nhập tay, theo thứ tự hiển thị sau cột Tiền thưởng. */
export const KPI_COT_THUONG_THEM = [
  { key: 'thuong_ql', labelKey: 'colThuongQl' },
  { key: 'thuong_nhom_tia', labelKey: 'colThuongNhomTia' },
  { key: 'thuong_nhom_cp', labelKey: 'colThuongNhomCp' },
] as const;

export type KpiCotThuongKey = 'tien_thuong' | (typeof KPI_COT_THUONG_THEM)[number]['key'];

/** Tổng một cột số tiền của bảng KPI / thưởng. */
export function sumCotKpiThuong(
  rows: Partial<Record<KpiCotThuongKey, number | null>>[] | null | undefined,
  key: KpiCotThuongKey
): number {
  return (rows ?? []).reduce((s, r) => s + Number(r?.[key] ?? 0), 0);
}

export type KpiThuongFormRow = {
  ten_hang_muc: string;
  don_vi_tinh: string | null;
  muc_tieu: string | null;
  thuc_te: string | null;
  phan_tram: number | null;
  danh_gia: string | null;
  tien_thuong: number;
  thuong_ql: number;
  thuong_nhom_tia: number;
  thuong_nhom_cp: number;
  ghi_chu: string | null;
};

export function sumTienThuongKpiThuong(rows: Pick<FarmBaoCaoKpiThuongRow, 'tien_thuong'>[]): number {
  return (rows ?? []).reduce((s, r) => s + Number(r.tien_thuong ?? 0), 0);
}

/**
 * Tính tỷ lệ % đạt KPI: `(thực tế / mục tiêu) × 100`.
 * Trả về null nếu mục tiêu hoặc thực tế không parse được thành số hợp lệ.
 */
export function computeKpiPhanTram(
  muc_tieu: string | null | undefined,
  thuc_te: string | null | undefined
): number | null {
  const normalize = (s: string | null | undefined) =>
    parseFloat(String(s ?? '').trim().replace(',', '.'));
  const mt = normalize(muc_tieu);
  const tt = normalize(thuc_te);
  if (!Number.isFinite(mt) || mt === 0 || !Number.isFinite(tt)) return null;
  return (tt / mt) * 100;
}
