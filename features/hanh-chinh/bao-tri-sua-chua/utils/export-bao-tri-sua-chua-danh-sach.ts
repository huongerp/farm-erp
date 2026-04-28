/**
 * Export danh sách phiếu chi phí tài sản (tab Tất cả) — cùng pattern với Đơn đặt hàng / ExportDialog.
 */
import type { TFunction } from 'i18next';
import type { PhieuBaoTriSuaChua } from '../core/types';
import type { ExportColumn } from '../../../../components/shared/ExportDialog';
import { formatDateShort, formatDateShortTime } from '../../../../lib/utils';
import { getTrangThaiLabel } from '../core/constants';

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

export const CHI_PHI_TAI_SAN_LIST_EXPORT_KEYS = [
  'id',
  'ngay',
  'id_tai_san',
  'ma_tai_san',
  'ten_tai_san',
  'id_hang_muc',
  'ten_hang_muc',
  'mo_ta',
  'so_tien',
  'ghi_chu',
  'trang_thai',
  'nguoi_duyet',
  'id_nguoi_tao',
  'ten_nguoi_tao',
  'tg_tao',
  'tg_cap_nhat',
] as const;

export function mapPhieuChiPhiTaiSanListRow(p: PhieuBaoTriSuaChua, t: TFunction): Record<string, unknown> {
  return {
    id: p.id,
    ngay: cellDate(p.ngay),
    id_tai_san: p.id_tai_san ?? '',
    ma_tai_san: (p.ma_tai_san ?? '').trim(),
    ten_tai_san: (p.ten_tai_san ?? '').trim(),
    id_hang_muc: p.id_hang_muc ?? '',
    ten_hang_muc: (p.ten_hang_muc ?? '').trim(),
    mo_ta: (p.mo_ta ?? '').trim(),
    so_tien: p.so_tien ?? 0,
    ghi_chu: (p.ghi_chu ?? '').trim(),
    trang_thai: getTrangThaiLabel(p.trang_thai, t),
    nguoi_duyet: (p.nguoi_duyet ?? '').trim(),
    id_nguoi_tao: p.id_nguoi_tao ?? '',
    ten_nguoi_tao: (p.ten_nguoi_tao ?? '').trim(),
    tg_tao: cellDateTime(p.tg_tao),
    tg_cap_nhat: cellDateTime(p.tg_cap_nhat),
  };
}

export function getExportColumnsPhieuChiPhiTaiSanList(t: TFunction): ExportColumn[] {
  return CHI_PHI_TAI_SAN_LIST_EXPORT_KEYS.map((key) => ({
    key,
    label: t(`baoTriSuaChua.export.list.${key}`),
  }));
}

export function exportFileNamePhieuChiPhiTaiSanList(): string {
  return 'HC_Chi_phi_tai_san';
}

export const LIST_EXPORT_SHEET_NAME = 'CP_tai_san';
