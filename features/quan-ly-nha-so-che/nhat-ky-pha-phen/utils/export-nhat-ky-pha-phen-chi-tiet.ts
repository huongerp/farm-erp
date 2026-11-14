/** Xuất tab Chi tiết: mỗi lần pha một dòng. */
import type { TFunction } from 'i18next';
import type { ExportColumn } from '../../../../components/shared/LazyExportDialog';
import { formatYmdToDisplay } from '../../../../lib/utils';
import type { NhatKyPhaPhenLanRow } from '../core/types';

const so = (n: number | null) => (n == null ? '' : n);

/** `stt` do nơi gọi tính (thứ tự dòng khi xuất). */
export function mapNhatKyPhaPhenChiTietRow(r: NhatKyPhaPhenLanRow, stt: number): Record<string, unknown> {
  return {
    stt,
    ngay: formatYmdToDisplay(r.ngay),
    ten_chi_nhanh: r.ten_chi_nhanh ?? '',
    lan: r.lan,
    gio: r.gio ?? '',
    so_kg: so(r.so_kg),
    dinh_muc_kg: so(r.dinh_muc_kg),
    chenh_lech: so(r.chenh_lech),
    nhan_su: r.ten_nhan_vien_phu_trach ?? '',
  };
}

const EXPORT_KEYS = [
  'stt',
  'ngay',
  'ten_chi_nhanh',
  'lan',
  'gio',
  'so_kg',
  'dinh_muc_kg',
  'chenh_lech',
  'nhan_su',
] as const;

export function getExportColumnsNhatKyPhaPhenChiTiet(t: TFunction): ExportColumn[] {
  return EXPORT_KEYS.map((key) => ({ key, label: t(`nkpp.chiTiet.export.${key}`) }));
}

export const exportFileNameNhatKyPhaPhenChiTiet = () =>
  `nhat-ky-pha-phen-chi-tiet-${new Date().toISOString().slice(0, 10)}`;
