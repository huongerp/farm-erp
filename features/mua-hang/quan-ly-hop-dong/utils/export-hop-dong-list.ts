import type { TFunction } from 'i18next';
import type { ExportColumn } from '../../../../components/shared/ExportDialog';
import type { HopDong, HopDongChiTietEnriched } from '../core/types';
import { formatDateShort, formatDateTimeShort, formatNumberVN, getTodayISODate } from '../../../../lib/utils';
import { TRANG_THAI_HOP_DONG } from '../core/constants';

export const LIST_EXPORT_SHEET_HOP_DONG = 'HopDong';
export const LIST_EXPORT_SHEET_THANH_TOAN = 'ThanhToan';

export const HOP_DONG_LIST_EXPORT_KEYS = [
  'ma_hop_dong',
  'ten_hop_dong',
  'ngay',
  'ten_nha_cung_cap',
  'so_luong_cay',
  'thanh_tien',
  'so_dot_thanh_toan',
  'tong_da_thanh_toan',
  'tong_cay_da_giao',
  'tien_con_lai',
  'cay_con_lai',
  'trang_thai',
  'ten_nguoi_tao',
  'tg_cap_nhat',
] as const;

export const THANH_TOAN_LIST_EXPORT_KEYS = [
  'ngay',
  'ma_hop_dong',
  'ten_hop_dong',
  'ten_dot',
  'so_tien',
  'so_cay_thuc_nhan',
  'ten_chi_nhanh',
  'ten_nha_cung_cap',
  'ghi_chu',
] as const;

function trangThaiLabel(trangThai: string, t: TFunction): string {
  return trangThai === TRANG_THAI_HOP_DONG[1]
    ? t('hopDong.trangThai.daThanhLy')
    : t('hopDong.trangThai.dangThucHien');
}

function cellDate(s: string | null | undefined): string {
  if (s == null || String(s).trim() === '') return '';
  return formatDateShort(s) || String(s).trim();
}

function cellDateTime(s: string | null | undefined): string {
  if (s == null || String(s).trim() === '') return '';
  return formatDateTimeShort(s) || String(s).trim();
}

function cellNum(v: number | null | undefined): string {
  if (v == null) return '';
  return formatNumberVN(Number(v)) ?? String(v);
}

export function mapHopDongListRow(item: HopDong, t: TFunction): Record<string, unknown> {
  return {
    ma_hop_dong: item.ma_hop_dong ?? '',
    ten_hop_dong: item.ten_hop_dong ?? '',
    ngay: cellDate(item.ngay),
    ten_nha_cung_cap: item.ten_nha_cung_cap ?? '',
    so_luong_cay: cellNum(item.so_luong_cay),
    thanh_tien: cellNum(item.thanh_tien),
    so_dot_thanh_toan: item.so_dot_thanh_toan != null ? String(item.so_dot_thanh_toan) : '',
    tong_da_thanh_toan: cellNum(item.tong_da_thanh_toan),
    tong_cay_da_giao: cellNum(item.tong_cay_da_giao),
    tien_con_lai: cellNum(item.tien_con_lai),
    cay_con_lai: cellNum(item.cay_con_lai),
    trang_thai: trangThaiLabel(item.trang_thai, t),
    ten_nguoi_tao: item.ten_nguoi_tao ?? '',
    tg_cap_nhat: cellDateTime(item.tg_cap_nhat),
  };
}

export function mapThanhToanListRow(
  item: HopDongChiTietEnriched,
  chiNhanhMap: Record<string, string>
): Record<string, unknown> {
  return {
    ngay: cellDate(item.ngay),
    ma_hop_dong: item.ma_hop_dong ?? '',
    ten_hop_dong: item.ten_hop_dong ?? '',
    ten_dot: item.ten_dot ?? '',
    so_tien: cellNum(item.so_tien),
    so_cay_thuc_nhan: cellNum(item.so_cay_thuc_nhan),
    ten_chi_nhanh: item.id_chi_nhanh ? (chiNhanhMap[item.id_chi_nhanh] ?? item.id_chi_nhanh) : '',
    ten_nha_cung_cap: item.ten_nha_cung_cap ?? '',
    ghi_chu: item.ghi_chu ?? '',
  };
}

export function getExportColumnsHopDongList(t: TFunction): ExportColumn[] {
  return HOP_DONG_LIST_EXPORT_KEYS.map((key) => ({
    key,
    label: t(`hopDong.export.list.${key}`),
  }));
}

export function getExportColumnsThanhToanList(t: TFunction): ExportColumn[] {
  return THANH_TOAN_LIST_EXPORT_KEYS.map((key) => ({
    key,
    label: t(`hopDong.export.thanhToan.${key}`),
  }));
}

export function exportFileNameHopDongList(): string {
  return `hop_dong_${getTodayISODate()}`;
}

export function exportFileNameThanhToanList(): string {
  return `thanh_toan_hop_dong_${getTodayISODate()}`;
}
