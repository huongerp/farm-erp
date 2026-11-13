/** Xuất danh sách nhật ký pha thuốc: mỗi lần pha một hàng (phiếu chưa có lần pha vẫn ra một hàng). */
import type { TFunction } from 'i18next';
import type { ExportColumn } from '../../../../components/shared/LazyExportDialog';
import { formatYmdToDisplay } from '../../../../lib/utils';
import type { LanPha, NhatKyPhunCui } from '../core/types';

export interface DongXuatNhatKy {
  stt: number;
  nhatKy: NhatKyPhunCui;
  lan: LanPha | null;
}

export function lamPhangNhatKy(list: readonly NhatKyPhunCui[]): DongXuatNhatKy[] {
  const out: DongXuatNhatKy[] = [];
  for (const nhatKy of list) {
    const dong = nhatKy.lan.length > 0 ? nhatKy.lan : [null];
    for (const lan of dong) out.push({ stt: out.length + 1, nhatKy, lan });
  }
  return out;
}

export function mapDongXuatNhatKy({ stt, nhatKy, lan }: DongXuatNhatKy): Record<string, unknown> {
  return {
    stt,
    ngay: formatYmdToDisplay(nhatKy.ngay),
    ten_chi_nhanh: nhatKy.ten_chi_nhanh ?? '',
    gio: lan?.gio ?? '',
    ten_hang_hoa: lan?.ten_hang_hoa ?? '',
    nong_do: lan?.nong_do ?? '',
    don_vi: lan?.don_vi ?? '',
    luong_nuoc_lit: lan?.luong_nuoc_lit ?? '',
    luong_thuoc: lan?.luong_thuoc ?? '',
    ten_nhan_vien_phu_trach: nhatKy.ten_nhan_vien_phu_trach ?? '',
    ghi_chu: lan ? (lan.ghi_chu ?? '') : (nhatKy.ghi_chu ?? ''),
  };
}

const EXPORT_KEYS = [
  'stt',
  'ngay',
  'ten_chi_nhanh',
  'gio',
  'ten_hang_hoa',
  'nong_do',
  'don_vi',
  'luong_nuoc_lit',
  'luong_thuoc',
  'ten_nhan_vien_phu_trach',
  'ghi_chu',
] as const;

export function getExportColumnsNhatKyPhunCui(t: TFunction): ExportColumn[] {
  return EXPORT_KEYS.map((key) => ({ key, label: t(`nkpc.export.${key}`) }));
}

export const exportFileNameNhatKyPhunCui = () => `nhat-ky-phun-cui-${new Date().toISOString().slice(0, 10)}`;
