import type { FarmBaoCaoKpiThuongRow, KpiThuongFormRow } from '../../shared/kpi-thuong/types';
import { kpiThuongRowsToForm } from '../../shared/kpi-thuong/form-mappers';

/** Đánh giá KPI cố định — thứ tự hiển thị trong combobox. */
export const BCSC_DANH_GIA_KPI_OPTIONS = ['Đạt', 'Tốt', 'Không đạt', 'Kém'] as const;
export type BcscDanhGiaKpi = (typeof BCSC_DANH_GIA_KPI_OPTIONS)[number];

const DEFAULT_DANH_GIA: BcscDanhGiaKpi = 'Không đạt';

interface KpiPreset {
  ten_hang_muc: string;
  don_vi_tinh: string;
  muc_tieu: string;
}

/** Hạng mục KPI / thưởng mặc định khi tạo phiếu báo cáo sơ chế mới. */
export const BCSC_KPI_THUONG_PRESETS: readonly KpiPreset[] = [
  { ten_hang_muc: 'Năng suất sơ chế',    don_vi_tinh: 'thùng', muc_tieu: '3,5'  },
  { ten_hang_muc: 'Tỷ lệ nải chuỗi lỗi', don_vi_tinh: '%',     muc_tieu: '1'    },
  { ten_hang_muc: 'Tỷ lệ thu hồi',       don_vi_tinh: '%',     muc_tieu: '85'   },
] as const;

export function defaultBcscKpiThuongRows(): KpiThuongFormRow[] {
  return BCSC_KPI_THUONG_PRESETS.map((p) => ({
    ten_hang_muc: p.ten_hang_muc,
    don_vi_tinh: p.don_vi_tinh,
    muc_tieu: p.muc_tieu,
    thuc_te: null,
    phan_tram: null,
    danh_gia: DEFAULT_DANH_GIA,
    tien_thuong: 0,
    ghi_chu: null,
  }));
}

/** Phiếu DB chưa có dòng KPI → 3 hạng mục mặc định (giống phẩm cấp). */
export function normalizeBcscKpiThuongToForm(
  rows: FarmBaoCaoKpiThuongRow[] | undefined | null
): KpiThuongFormRow[] {
  const list = rows ?? [];
  if (list.length === 0) return defaultBcscKpiThuongRows();
  return kpiThuongRowsToForm(list);
}
