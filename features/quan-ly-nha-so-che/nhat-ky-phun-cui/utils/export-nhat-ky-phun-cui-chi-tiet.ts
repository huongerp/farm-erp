/** Xuất tab Chi tiết: mỗi lần pha một dòng. */
import type { TFunction } from 'i18next';
import type { ExportColumn } from '../../../../components/shared/LazyExportDialog';
import { formatYmdToDisplay } from '../../../../lib/utils';
import type { NhatKyPhunCuiLanRow } from '../core/types';

const so = (n: number | null) => (n == null ? '' : n);

/** `stt` do nơi gọi tính (thứ tự dòng khi xuất). */
export function mapNhatKyPhunCuiChiTietRow(r: NhatKyPhunCuiLanRow, stt: number): Record<string, unknown> {
  return {
    stt,
    ngay: formatYmdToDisplay(r.ngay),
    ten_chi_nhanh: r.ten_chi_nhanh ?? '',
    thu_tu: r.thu_tu,
    gio: r.gio ?? '',
    ten_hang_hoa: r.ten_hang_hoa ?? '',
    nong_do: so(r.nong_do),
    don_vi: r.don_vi,
    luong_nuoc_lit: so(r.luong_nuoc_lit),
    luong_thuoc: so(r.luong_thuoc),
    ghi_chu: r.ghi_chu ?? '',
    nhan_su: r.ten_nhan_vien_phu_trach ?? '',
  };
}

const EXPORT_KEYS = [
  'stt',
  'ngay',
  'ten_chi_nhanh',
  'thu_tu',
  'gio',
  'ten_hang_hoa',
  'nong_do',
  'don_vi',
  'luong_nuoc_lit',
  'luong_thuoc',
  'ghi_chu',
  'nhan_su',
] as const;

export function getExportColumnsNhatKyPhunCuiChiTiet(t: TFunction): ExportColumn[] {
  return EXPORT_KEYS.map((key) => ({ key, label: t(`nkpc.chiTiet.export.${key}`) }));
}

export const exportFileNameNhatKyPhunCuiChiTiet = () =>
  `nhat-ky-phun-cui-chi-tiet-${new Date().toISOString().slice(0, 10)}`;
