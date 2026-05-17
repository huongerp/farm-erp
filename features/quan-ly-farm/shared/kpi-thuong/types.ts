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
  ghi_chu: string | null;
}

export type KpiThuongFormRow = {
  ten_hang_muc: string;
  don_vi_tinh: string | null;
  muc_tieu: string | null;
  thuc_te: string | null;
  phan_tram: number | null;
  danh_gia: string | null;
  tien_thuong: number;
  ghi_chu: string | null;
};

export function sumTienThuongKpiThuong(rows: Pick<FarmBaoCaoKpiThuongRow, 'tien_thuong'>[]): number {
  return (rows ?? []).reduce((s, r) => s + Number(r.tien_thuong ?? 0), 0);
}
