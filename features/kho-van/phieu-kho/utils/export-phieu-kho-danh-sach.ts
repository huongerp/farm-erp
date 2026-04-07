/**
 * Export danh sách phiếu kho (tab Nhập / Xuất / Chuyển) và tab chi tiết: map + định nghĩa cột.
 */
import type { TFunction } from 'i18next';
import type { PhieuKho, ChiTietPhieuKhoFlat } from '../core/types';
import type { ExportColumn } from '../../../../components/shared/ExportDialog';

/** Thứ tự cột xuất — khớp key trong mapPhieuKhoListRow */
export const PHIEU_KHO_LIST_EXPORT_KEYS = [
  'id',
  'so_phieu',
  'ngay',
  'loai',
  'trang_thai',
  'kho_id',
  'ten_kho',
  'kho_den_id',
  'ten_kho_den',
  'id_nha_cung_cap',
  'ten_nha_cung_cap',
  'id_khach_hang',
  'ten_khach_hang',
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

export function mapPhieuKhoListRow(p: PhieuKho): Record<string, unknown> {
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
    id_nha_cung_cap: p.id_nha_cung_cap ?? '',
    ten_nha_cung_cap: p.ten_nha_cung_cap ?? '',
    id_khach_hang: p.id_khach_hang ?? '',
    ten_khach_hang: p.ten_khach_hang ?? '',
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

export function getExportColumnsPhieuKhoList(t: TFunction): ExportColumn[] {
  return PHIEU_KHO_LIST_EXPORT_KEYS.map((key) => ({
    key,
    label: t(`phieuKho.export.list.${key}`),
  }));
}

export function exportFileNamePhieuKhoTab(loai: 'nhap' | 'xuat' | 'chuyen'): string {
  if (loai === 'nhap') return 'Phieu_kho_nhap';
  if (loai === 'xuat') return 'Phieu_kho_xuat';
  return 'Phieu_kho_chuyen';
}

export const CHI_TIET_PHIEU_KHO_EXPORT_KEYS = [
  'id',
  'id_phieu_kho',
  'so_phieu',
  'ngay',
  'loai',
  'kho_id',
  'ten_kho',
  'kho_den_id',
  'ten_kho_den',
  'id_nha_cung_cap',
  'ten_nha_cung_cap',
  'id_khach_hang',
  'ten_khach_hang',
  'trang_thai',
  'mo_ta',
  'trao_doi',
  'phieu_tg_tao',
  'phieu_tg_cap_nhat',
  'nguoi_tao_id',
  'ten_nguoi_tao',
  'id_nguoi_duyet',
  'ten_nguoi_duyet',
  'id_hang_hoa',
  'ten_hang_hoa',
  'ma_hang',
  'ten_hang',
  'so_luong',
  'don_gia',
  'thanh_tien',
  'don_vi_tinh',
  'so_lot',
  'ghi_chu',
  'chi_tiet_nguoi_tao_id',
  'chi_tiet_ten_nguoi_tao',
  'chi_tiet_tg_tao',
  'chi_tiet_tg_cap_nhat',
] as const;

export function mapChiTietPhieuKhoFlatRow(row: ChiTietPhieuKhoFlat): Record<string, unknown> {
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
    id_nha_cung_cap: row.id_nha_cung_cap ?? '',
    ten_nha_cung_cap: row.ten_nha_cung_cap ?? '',
    id_khach_hang: row.id_khach_hang ?? '',
    ten_khach_hang: row.ten_khach_hang ?? '',
    trang_thai: row.trang_thai ?? '',
    mo_ta: row.mo_ta ?? '',
    trao_doi: row.trao_doi ?? '',
    phieu_tg_tao: row.phieu_tg_tao ?? '',
    phieu_tg_cap_nhat: row.phieu_tg_cap_nhat ?? '',
    nguoi_tao_id: row.nguoi_tao_id ?? '',
    ten_nguoi_tao: row.ten_nguoi_tao ?? '',
    id_nguoi_duyet: row.id_nguoi_duyet ?? '',
    ten_nguoi_duyet: row.ten_nguoi_duyet ?? '',
    id_hang_hoa: row.id_hang_hoa ?? '',
    ten_hang_hoa: row.ten_hang_hoa ?? '',
    ma_hang: row.ma_hang ?? '',
    ten_hang: row.ten_hang ?? '',
    so_luong: row.so_luong ?? 0,
    don_gia: row.don_gia ?? '',
    thanh_tien: row.thanh_tien ?? '',
    don_vi_tinh: row.don_vi_tinh ?? '',
    so_lot: row.so_lot ?? '',
    ghi_chu: row.ghi_chu ?? '',
    chi_tiet_nguoi_tao_id: row.chi_tiet_nguoi_tao_id ?? '',
    chi_tiet_ten_nguoi_tao: row.chi_tiet_ten_nguoi_tao ?? '',
    chi_tiet_tg_tao: row.chi_tiet_tg_tao ?? '',
    chi_tiet_tg_cap_nhat: row.chi_tiet_tg_cap_nhat ?? '',
  };
}

export function getExportColumnsChiTietPhieuKho(t: TFunction): ExportColumn[] {
  return CHI_TIET_PHIEU_KHO_EXPORT_KEYS.map((key) => ({
    key,
    label: t(`phieuKho.export.chiTiet.${key}`),
  }));
}
