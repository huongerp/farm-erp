/**
 * Export danh sách đơn đặt hàng (tab Danh sách) và tab Chi tiết: map + định nghĩa cột.
 * Thứ tự cột danh sách: ưu tiên tra cứu theo PO → ngày → trạng thái → đối tác/kho/người → ghi chú → id kỹ thuật.
 */
import type { TFunction } from 'i18next';
import type { ChiTietDonDatHangFlat, DonDatHang } from '../core/types';
import type { ExportColumn } from '../../../../components/shared/LazyExportDialog';
import { formatDateShort, formatDateShortTime } from '../../../../lib/utils';

function cellDate(s: string | undefined | null): string {
  if (s == null || String(s).trim() === '') return '';
  const d = formatDateShort(s);
  return d || String(s).trim();
}

function cellDateTime(s: string | undefined | null): string {
  if (s == null || String(s).trim() === '') return '';
  const d = formatDateShortTime(s);
  return d || String(s).trim();
}

/** Thứ tự cột file xuất (Excel/CSV/PDF) — dễ lọc, dễ đọc. */
export const DON_DAT_HANG_LIST_EXPORT_KEYS = [
  'so_po',
  'ngay_dat',
  'ngay_giao_dk',
  'trang_thai',
  'ten_nha_cung_cap',
  'ma_nha_cung_cap',
  'id_nha_cung_cap',
  'ten_kho_nhan',
  'id_kho_nhan',
  'so_phieu_de_xuat',
  'id_phieu_de_xuat_vat_tu',
  'ten_nguoi_dat',
  'ma_nguoi_dat',
  'id_nguoi_dat',
  'ten_nguoi_duyet',
  'ma_nguoi_duyet',
  'id_nguoi_duyet',
  'dieu_khoan_thanh_toan',
  'ghi_chu',
  'tg_cap_nhat',
  'tg_tao',
  'id',
] as const;

export function mapDonDatHangListRow(p: DonDatHang): Record<string, unknown> {
  return {
    id: p.id,
    so_po: (p.so_po ?? '').trim(),
    ngay_dat: cellDate(p.ngay_dat),
    ngay_giao_dk: cellDate(p.ngay_giao_dk),
    id_nha_cung_cap: p.id_nha_cung_cap ?? '',
    ten_nha_cung_cap: (p.ten_nha_cung_cap ?? '').trim(),
    ma_nha_cung_cap: (p.ma_nha_cung_cap ?? '').trim(),
    id_kho_nhan: p.id_kho_nhan ?? '',
    ten_kho_nhan: (p.ten_kho_nhan ?? '').trim(),
    id_phieu_de_xuat_vat_tu: p.id_phieu_de_xuat_vat_tu ?? '',
    so_phieu_de_xuat: (p.so_phieu_de_xuat ?? '').trim(),
    id_nguoi_dat: p.id_nguoi_dat ?? '',
    ten_nguoi_dat: (p.ten_nguoi_dat ?? '').trim(),
    ma_nguoi_dat: (p.ma_nguoi_dat ?? '').trim(),
    id_nguoi_duyet: p.id_nguoi_duyet ?? '',
    ten_nguoi_duyet: (p.ten_nguoi_duyet ?? '').trim(),
    ma_nguoi_duyet: (p.ma_nguoi_duyet ?? '').trim(),
    dieu_khoan_thanh_toan: (p.dieu_khoan_thanh_toan ?? '').trim(),
    ghi_chu: (p.ghi_chu ?? '').trim(),
    trang_thai: p.trang_thai ?? '',
    tg_tao: cellDateTime(p.tg_tao),
    tg_cap_nhat: cellDateTime(p.tg_cap_nhat),
  };
}

export function getExportColumnsDonDatHangList(t: TFunction): ExportColumn[] {
  return DON_DAT_HANG_LIST_EXPORT_KEYS.map((key) => ({
    key,
    label: t(`donDatHang.export.list.${key}`),
  }));
}

/** Tên file (ExportDialog tự thêm _YYYY-MM-DD). */
export function exportFileNameDonDatHangList(): string {
  return 'PO_Don_dat_hang';
}

export const LIST_EXPORT_SHEET_NAME = 'PO_danh_sach';

export const CHI_TIET_DON_DAT_HANG_EXPORT_KEYS = [
  'chi_tiet_id',
  'id_don_dat_hang',
  'so_po',
  'ngay_dat',
  'ngay_giao_dk',
  'id_nha_cung_cap',
  'ten_nha_cung_cap',
  'ma_nha_cung_cap',
  'id_kho_nhan',
  'ten_kho_nhan',
  'id_phieu_de_xuat_vat_tu',
  'so_phieu_de_xuat',
  'trang_thai',
  'don_ghi_chu',
  'don_tg_tao',
  'don_tg_cap_nhat',
  'id_nguoi_dat',
  'ten_nguoi_dat',
  'ma_nguoi_dat',
  'id_nguoi_duyet',
  'ten_nguoi_duyet',
  'ma_nguoi_duyet',
  'id_hang_hoa',
  'ten_danh_muc_cap1',
  'ten_danh_muc_cap2',
  'phan_loai',
  'ma_hang',
  'ten_hang',
  'so_luong',
  'don_gia',
  'thanh_tien',
  'don_vi_tinh',
  'muc_dich_su_dung',
  'ghi_chu',
] as const;

export function mapChiTietDonDatHangFlatRow(row: ChiTietDonDatHangFlat): Record<string, unknown> {
  return {
    chi_tiet_id: row.id,
    id_don_dat_hang: row.id_don_dat_hang,
    so_po: (row.so_po ?? '').trim(),
    ngay_dat: cellDate(row.ngay_dat),
    ngay_giao_dk: cellDate(row.ngay_giao_dk),
    id_nha_cung_cap: row.id_nha_cung_cap ?? '',
    ten_nha_cung_cap: (row.ten_nha_cung_cap ?? '').trim(),
    ma_nha_cung_cap: (row.ma_nha_cung_cap ?? '').trim(),
    id_kho_nhan: row.id_kho_nhan ?? '',
    ten_kho_nhan: (row.ten_kho_nhan ?? '').trim(),
    id_phieu_de_xuat_vat_tu: row.id_phieu_de_xuat_vat_tu ?? '',
    so_phieu_de_xuat: (row.so_phieu_de_xuat ?? '').trim(),
    trang_thai: row.trang_thai ?? '',
    don_ghi_chu: (row.don_ghi_chu ?? '').trim(),
    don_tg_tao: cellDateTime(row.don_tg_tao),
    don_tg_cap_nhat: cellDateTime(row.don_tg_cap_nhat),
    id_nguoi_dat: row.id_nguoi_dat ?? '',
    ten_nguoi_dat: (row.ten_nguoi_dat ?? '').trim(),
    ma_nguoi_dat: (row.ma_nguoi_dat ?? '').trim(),
    id_nguoi_duyet: row.id_nguoi_duyet ?? '',
    ten_nguoi_duyet: (row.ten_nguoi_duyet ?? '').trim(),
    ma_nguoi_duyet: (row.ma_nguoi_duyet ?? '').trim(),
    id_hang_hoa: row.id_hang_hoa ?? '',
    ten_danh_muc_cap1: (row.ten_danh_muc_cap1 ?? '').trim(),
    ten_danh_muc_cap2: (row.ten_danh_muc_cap2 ?? '').trim(),
    phan_loai: (row.phan_loai ?? '').trim(),
    ma_hang: (row.ma_hang ?? '').trim(),
    ten_hang: (row.ten_hang ?? '').trim(),
    so_luong: row.so_luong ?? 0,
    don_gia: row.don_gia ?? '',
    thanh_tien: row.thanh_tien ?? '',
    don_vi_tinh: (row.don_vi_tinh ?? '').trim(),
    muc_dich_su_dung: (row.muc_dich_su_dung ?? '').trim(),
    ghi_chu: (row.ghi_chu ?? '').trim(),
  };
}

export function getExportColumnsChiTietDonDatHang(t: TFunction): ExportColumn[] {
  return CHI_TIET_DON_DAT_HANG_EXPORT_KEYS.map((key) => ({
    key,
    label: t(`donDatHang.export.chiTiet.${key}`),
  }));
}

export function exportFileNameDonDatHangChiTiet(): string {
  return 'PO_Don_dat_hang_chi_tiet';
}

export const CHI_TIET_EXPORT_SHEET_NAME = 'PO_chi_tiet';
