/**
 * CSDL: cha `fp_farm_bao_cao_so_che` (ngày, chi nhánh, ghi chú, trạng thái, …)
 * + con `fp_farm_bao_cao_so_che_ct` (chỉ tiêu buồng) + `fp_farm_bao_cao_so_che_pham_cap` (phẩm cấp — nhiều dòng / phiếu).
 * `FarmBaoCaoSoChe` gộp cha + các bảng con — UI/form một object.
 */
import type { SoLieuRowKey, SoLieuRowMeta } from './so-lieu-row-meta';
import type { FarmBaoCaoSoChePhamCapRow } from './pham-cap';
import type { FarmBaoCaoKpiThuongRow } from '../../shared/kpi-thuong/types';
export type { FarmBaoCaoKpiThuongRow } from '../../shared/kpi-thuong/types';
export { sumTienThuongKpiThuong } from '../../shared/kpi-thuong/types';

/** `mo` = đang mở, `khoa` = đã khóa (chỉ quản trị sửa/xóa). */
export type TrangThaiBaoCaoSoChePhieu = 'mo' | 'khoa';

export const TRANG_THAI_BAO_CAO_SO_CHE = {
  MO: 'mo' as const,
  KHOA: 'khoa' as const,
} as const;

/** Một dòng bảng con `fp_farm_bao_cao_so_che_ct` (một chỉ tiêu / phiếu). */
export interface FarmBaoCaoSoCheCt {
  id: string;
  id_bao_cao: string;
  ma_chi_tieu: SoLieuRowKey;
  gia_tri: number;
  don_vi_tinh: string;
  ghi_chu: string | null;
  thu_tu: number;
}

export interface FarmBaoCaoSoChe {
  id: string;
  /** ISO date yyyy-mm-dd — cột bảng cha */
  ngay: string;
  id_chi_nhanh: string | null;
  ten_chi_nhanh: string | null;
  /** Các trường sau lưu ở bảng con `_ct`, merge khi đọc/ghi */
  don_vi_tinh: string;
  sl_buong_ton_dau_ngay: number;
  tong_buong_thu_hoach: number;
  tong_buong_khong_so_che: number;
  tong_buong_so_che: number;
  sl_buong_ton_cuoi_ngay: number;
  /** Đánh giá lỗi QC (%) — `fp_farm_bao_cao_so_che_ct.danh_gia_loi_qc_pct` */
  danh_gia_loi_qc_pct: number;
  /** Meta từng dòng buồng — suy ra từ các dòng `_ct` (ĐVT/ghi chú theo `ma_chi_tieu`), không còn jsonb trên DB. */
  so_lieu_row_meta?: SoLieuRowMeta;
  /** Các dòng phẩm cấp — `fp_farm_bao_cao_so_che_pham_cap` (thiếu DB → mảng rỗng). */
  pham_cap: FarmBaoCaoSoChePhamCapRow[];
  /** Đánh giá KPI / thưởng — `fp_farm_bao_cao_so_che_kpi` */
  kpi_thuong: FarmBaoCaoKpiThuongRow[];
  ghi_chu: string | null;
  id_nguoi_tao: string | null;
  ten_nguoi_tao: string | null;
  trang_thai: TrangThaiBaoCaoSoChePhieu;
  tg_tao: string;
  tg_cap_nhat: string;
}
