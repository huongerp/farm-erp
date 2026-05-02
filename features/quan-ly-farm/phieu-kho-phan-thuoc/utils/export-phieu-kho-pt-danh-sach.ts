/**
 * Export danh sách phiếu kho phân thuốc + tab chi tiết: map + cột ExportDialog.
 */
import type { TFunction } from 'i18next';
import type { PhieuKhoPT, ChiTietPhieuKhoPTFlat } from '../core/types';
import type { ExportColumn } from '../../../../components/shared/ExportDialog';

export const PHIEU_KHO_PT_LIST_EXPORT_KEYS = [
  'id',
  'so_phieu',
  'ngay',
  'loai',
  'trang_thai',
  'kho_id',
  'ten_kho',
  'kho_den_id',
  'ten_kho_den',
  'mo_ta',
  'trao_doi',
  'nguoi_tao_id',
  'ten_nguoi_tao',
  'id_nguoi_duyet',
  'ten_nguoi_duyet',
  'tg_tao',
  'tg_cap_nhat',
  'tong_so_dong',
  'tong_so_luong',
  'tong_tien',
] as const;

export function mapPhieuKhoPTListRow(p: PhieuKhoPT): Record<string, unknown> {
  return {
    id: p.id,
    so_phieu: p.so_phieu ?? '',
    ngay: p.ngay ?? '',
    loai: p.loai ?? '',
    trang_thai: p.trang_thai ?? '',
    kho_id: p.kho_id ?? '',
    ten_kho: p.ten_kho ?? '',
    kho_den_id: p.kho_den_id ?? '',
    ten_kho_den: p.ten_kho_den ?? '',
    mo_ta: p.mo_ta ?? '',
    trao_doi: p.trao_doi ?? '',
    nguoi_tao_id: p.nguoi_tao_id ?? '',
    ten_nguoi_tao: p.ten_nguoi_tao ?? '',
    id_nguoi_duyet: p.id_nguoi_duyet ?? '',
    ten_nguoi_duyet: p.ten_nguoi_duyet ?? '',
    tg_tao: p.tg_tao ?? '',
    tg_cap_nhat: p.tg_cap_nhat ?? '',
    tong_so_dong: p.tong_so_dong ?? 0,
    tong_so_luong: p.tong_so_luong ?? 0,
    tong_tien: p.tong_tien ?? 0,
  };
}

export function getExportColumnsPhieuKhoPTList(t: TFunction): ExportColumn[] {
  return PHIEU_KHO_PT_LIST_EXPORT_KEYS.map((key) => ({
    key,
    label: t(`phieuKhoPhanThuoc.export.list.${key}`),
  }));
}

export function exportFileNamePhieuKhoPTDanhSach(): string {
  return 'Phieu_kho_phan_thuoc_danh_sach';
}

export const CHI_TIET_PHIEU_KHO_PT_EXPORT_KEYS = [
  'id',
  'id_phieu_kho',
  'so_phieu',
  'ngay',
  'loai',
  'kho_id',
  'ten_kho',
  'kho_den_id',
  'ten_kho_den',
  'trang_thai',
  'mo_ta',
  'phieu_tg_tao',
  'phieu_tg_cap_nhat',
  'nguoi_tao_id',
  'ten_nguoi_tao',
  'id_nguoi_duyet',
  'ten_nguoi_duyet',
  'id_hang_hoa',
  'ma_hang',
  'ten_hang',
  'so_luong',
  'don_gia',
  'thanh_tien',
  'don_vi_tinh',
  'so_lot',
  'ghi_chu',
] as const;

export function mapChiTietPhieuKhoPTFlatRow(row: ChiTietPhieuKhoPTFlat): Record<string, unknown> {
  return {
    id: row.id,
    id_phieu_kho: row.id_phieu_kho,
    so_phieu: row.so_phieu ?? '',
    ngay: row.ngay ?? '',
    loai: row.loai ?? '',
    kho_id: row.kho_id ?? '',
    ten_kho: row.ten_kho ?? '',
    kho_den_id: row.kho_den_id ?? '',
    ten_kho_den: row.ten_kho_den ?? '',
    trang_thai: row.trang_thai ?? '',
    mo_ta: row.mo_ta ?? '',
    phieu_tg_tao: row.phieu_tg_tao ?? '',
    phieu_tg_cap_nhat: row.phieu_tg_cap_nhat ?? '',
    nguoi_tao_id: row.nguoi_tao_id ?? '',
    ten_nguoi_tao: row.ten_nguoi_tao ?? '',
    id_nguoi_duyet: row.id_nguoi_duyet ?? '',
    ten_nguoi_duyet: row.ten_nguoi_duyet ?? '',
    id_hang_hoa: row.id_hang_hoa ?? '',
    ma_hang: row.ma_hang ?? '',
    ten_hang: row.ten_hang ?? row.ten_hang_hoa ?? '',
    so_luong: row.so_luong ?? 0,
    don_gia: row.don_gia ?? '',
    thanh_tien: row.thanh_tien ?? '',
    don_vi_tinh: row.don_vi_tinh ?? '',
    so_lot: row.so_lot ?? '',
    ghi_chu: row.ghi_chu ?? '',
  };
}

export function getExportColumnsChiTietPhieuKhoPT(t: TFunction): ExportColumn[] {
  return CHI_TIET_PHIEU_KHO_PT_EXPORT_KEYS.map((key) => ({
    key,
    label: t(`phieuKhoPhanThuoc.export.chiTiet.${key}`),
  }));
}

export function exportFileNamePhieuKhoPTChiTiet(): string {
  return 'Phieu_kho_phan_thuoc_chi_tiet';
}
