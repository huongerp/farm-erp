/**
 * Export danh sách báo cáo sơ chế: map phẳng + cột ExportDialog.
 */
import type { TFunction } from 'i18next';
import type { FarmBaoCaoSoChe } from '../core/types';
import { TRANG_THAI_BAO_CAO_SO_CHE, sumTienThuongKpiThuong } from '../core/types';
import { sumPhamCapDisplayTotals } from '../core/pham-cap-derived';
import type { ExportColumn } from '../../../../components/shared/LazyExportDialog';
import { formatDateShort, formatDateTimeShort, formatNumberVN } from '../../../../lib/utils';

export const BAO_CAO_SO_CHE_LIST_EXPORT_KEYS = [
  'id',
  'ngay',
  'id_chi_nhanh',
  'ten_chi_nhanh',
  'trang_thai',
  'don_vi_tinh',
  'sl_buong_ton_dau_ngay',
  'tong_buong_thu_hoach',
  'tong_buong_khong_so_che',
  'tong_buong_so_che',
  'sl_buong_ton_cuoi_ngay',
  'danh_gia_loi_qc_pct',
  'tong_thung_pc',
  'tong_kg_pc',
  'tong_thuong_kpi',
  'ghi_chu',
  'id_nguoi_tao',
  'ten_nguoi_tao',
  'tg_tao',
  'tg_cap_nhat',
] as const;

export function mapFarmBaoCaoSoCheListRow(
  item: FarmBaoCaoSoChe,
  t: TFunction
): Record<string, unknown> {
  const locked = item.trang_thai === TRANG_THAI_BAO_CAO_SO_CHE.KHOA;
  const phamCap = sumPhamCapDisplayTotals(item.pham_cap ?? []);
  const tongThuong = sumTienThuongKpiThuong(item.kpi_thuong ?? []);
  return {
    id: item.id,
    ngay: formatDateShort(item.ngay),
    id_chi_nhanh: item.id_chi_nhanh ?? '',
    ten_chi_nhanh: item.ten_chi_nhanh ?? '',
    trang_thai: locked ? t('baoCaoSoChe.trangThai.khoa') : t('baoCaoSoChe.trangThai.mo'),
    don_vi_tinh: item.don_vi_tinh ?? '',
    sl_buong_ton_dau_ngay: formatNumberVN(item.sl_buong_ton_dau_ngay),
    tong_buong_thu_hoach: formatNumberVN(item.tong_buong_thu_hoach),
    tong_buong_khong_so_che: formatNumberVN(item.tong_buong_khong_so_che),
    tong_buong_so_che: formatNumberVN(item.tong_buong_so_che),
    sl_buong_ton_cuoi_ngay: formatNumberVN(item.sl_buong_ton_cuoi_ngay),
    danh_gia_loi_qc_pct: formatNumberVN(item.danh_gia_loi_qc_pct),
    tong_thung_pc: formatNumberVN(phamCap.so_thung),
    tong_kg_pc: formatNumberVN(phamCap.tong_kg),
    tong_thuong_kpi: formatNumberVN(tongThuong),
    ghi_chu: item.ghi_chu ?? '',
    id_nguoi_tao: item.id_nguoi_tao ?? '',
    ten_nguoi_tao: item.ten_nguoi_tao ?? '',
    tg_tao: item.tg_tao ? formatDateTimeShort(item.tg_tao) : '',
    tg_cap_nhat: item.tg_cap_nhat ? formatDateTimeShort(item.tg_cap_nhat) : '',
  };
}

export function getExportColumnsBaoCaoSoCheList(t: TFunction): ExportColumn[] {
  return BAO_CAO_SO_CHE_LIST_EXPORT_KEYS.map((key) => ({
    key,
    label: t(`baoCaoSoChe.export.list.${key}`),
  }));
}

export function exportFileNameBaoCaoSoCheDanhSach(): string {
  return 'Bao_cao_so_che';
}
