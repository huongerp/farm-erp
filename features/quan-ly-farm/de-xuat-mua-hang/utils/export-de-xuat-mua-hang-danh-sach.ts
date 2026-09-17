/**
 * Xuất tab Danh sách phiếu đề xuất vật tư (ExportDialog).
 */
import type { TFunction } from 'i18next';
import type { DeXuatMuaHang } from '../core/types';
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

export const DE_XUAT_MUA_HANG_LIST_EXPORT_KEYS = [
  'so_phieu',
  'ngay',
  'ngay_can',
  'trang_thai',
  'ten_noi_de_xuat',
  'id_noi_de_xuat',
  'ten_nguoi_de_xuat',
  'ma_nguoi_de_xuat',
  'id_nguoi_de_xuat',
  'ten_nguoi_duyet',
  'ma_nguoi_duyet',
  'id_nguoi_duyet',
  'ghi_chu',
  'tong_so_dong',
  'tong_so_luong',
  'tg_tao',
  'tg_cap_nhat',
  'id',
] as const;

export function mapDeXuatMuaHangListRow(p: DeXuatMuaHang): Record<string, unknown> {
  return {
    id: p.id,
    so_phieu: (p.so_phieu ?? '').trim(),
    ngay: cellDate(p.ngay),
    ngay_can: cellDate(p.ngay_can),
    id_noi_de_xuat: p.id_noi_de_xuat ?? '',
    ten_noi_de_xuat: (p.ten_noi_de_xuat ?? '').trim(),
    id_nguoi_de_xuat: p.id_nguoi_de_xuat ?? '',
    ten_nguoi_de_xuat: (p.ten_nguoi_de_xuat ?? '').trim(),
    ma_nguoi_de_xuat: (p.ma_nguoi_de_xuat ?? '').trim(),
    id_nguoi_duyet: p.id_nguoi_duyet ?? '',
    ten_nguoi_duyet: (p.ten_nguoi_duyet ?? '').trim(),
    ma_nguoi_duyet: (p.ma_nguoi_duyet ?? '').trim(),
    ghi_chu: (p.ghi_chu ?? '').trim(),
    trang_thai: p.trang_thai ?? '',
    tong_so_dong: p.tong_so_dong ?? 0,
    tong_so_luong: p.tong_so_luong ?? 0,
    tg_tao: cellDateTime(p.tg_tao),
    tg_cap_nhat: cellDateTime(p.tg_cap_nhat),
  };
}

export function getExportColumnsDeXuatMuaHangList(t: TFunction): ExportColumn[] {
  return DE_XUAT_MUA_HANG_LIST_EXPORT_KEYS.map((key) => ({
    key,
    label: t(`deXuatMuaHang.export.list.${key}`),
  }));
}

export function exportFileNameDeXuatMuaHangList(): string {
  return 'De_xuat_mua_hang';
}

export const LIST_EXPORT_SHEET_NAME = 'De_xuat_mua_hang_danh_sach';
