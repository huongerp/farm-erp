/**
 * Thống kê sản xuất — types cho module tổng hợp 3 nguồn:
 * BCNC (báo cáo nhân công) + BCSC (báo cáo sơ chế) + DBDT (dự báo SL đóng thùng).
 * Mỗi hàng = 1 ngày × 1 chi nhánh.
 */
import type { FarmBaoCaoNhanCong } from '../../bao-cao-nhan-cong/core/types';
import type { FarmBaoCaoSoChe, FarmBaoCaoKpiThuongRow } from '../../bao-cao-so-che/core/types';
import type { FarmDuBaoSlDongThung } from '../../du-bao-sl-dong-thung/core/types';
import type { DuBaoSlDongThungKpi } from '../../du-bao-sl-dong-thung/core/kpi';

export type { FarmBaoCaoNhanCong, FarmBaoCaoSoChe, FarmDuBaoSlDongThung };

// ─── Nhân công computed ───────────────────────────────────────────────────────

export interface BcncSnapshot {
  tongCongQuyDoi: number;
  tongGioTangCaTich: number;
  cnSanXuatNgay: number;
  cnSanXuatNua: number;
  cnTangCa: number;
  tongCongQuyDoiSanXuat: number;
  cnDinhBien: number;
  kDinhBien: number | null;
}

// ─── KPI computed ─────────────────────────────────────────────────────────────

export interface KpiSnapshot {
  rows: FarmBaoCaoKpiThuongRow[];
  soKpiDat: number;
  tongKpi: number;
  tatCaKpiDat: boolean;
  tongTienThuong: number;
}

// ─── Merged row ───────────────────────────────────────────────────────────────

export interface ThongKeSanXuatRow {
  key: string;
  ngay: string;
  id_chi_nhanh: string;
  ten_chi_nhanh: string;
  bcnc: FarmBaoCaoNhanCong | null;
  bcsc: FarmBaoCaoSoChe | null;
  dbdt: FarmDuBaoSlDongThung | null;
  bcncSnapshot: BcncSnapshot | null;
  kpiSnapshot: KpiSnapshot | null;
  dbdtKpi: DuBaoSlDongThungKpi | null;
}

// ─── Filters ──────────────────────────────────────────────────────────────────

export interface ThongKeSanXuatFilters {
  /** Preset id cho DateRangePicker ('custom' khi nhập tay) */
  datePreset: string;
  /** YYYY-MM-DD */
  dateFrom: string;
  /** YYYY-MM-DD */
  dateTo: string;
  chiNhanhIds: string[];
  /** 'dat' | 'khong_dat' — multi-select OR */
  kpiFilter: string[];
  /** 'du_3bc' | 'thieu_bc' — multi-select OR */
  hienThiFilter: string[];
  /** 'mo' | 'khoa' */
  trangThaiBcncFilter: string[];
  /** 'mo' | 'khoa' */
  trangThaiBcscFilter: string[];
}

// ─── Summary ──────────────────────────────────────────────────────────────────

export interface ThongKeSanXuatSummary {
  tongNgay: number;
  ngayDu3Bc: number;
  tongCongQuyDoi: number;
  tbCongQuyDoiNgay: number | null;
  tongGioTangCaTich: number;
  tbGioTangCaNgay: number | null;
  tbCnDinhBien: number | null;
  tbKDinhBien: number | null;
  ngayCoBcsc: number;
  ngayDatKpi: number;
  tongTienThuong: number;
  tongBuongSoChe: number;
  tongSoThungTT: number;
}
