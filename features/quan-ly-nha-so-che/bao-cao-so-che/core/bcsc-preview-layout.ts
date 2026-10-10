/**
 * Layout chung cho in / xuất báo cáo sơ chế: tổng quan nhiều cột + footer chữ ký.
 */
import type { TFunction } from 'i18next';
import type { FarmBaoCaoSoChe } from './types';
import { TRANG_THAI_BAO_CAO_SO_CHE } from './types';
import { formatDateShort, formatNumberVN } from '../../../../lib/utils';

export type BcscPreviewField = { label: string; value: string; bold?: boolean };

export function bcscTrangThaiLabel(data: FarmBaoCaoSoChe, t: TFunction): string {
  return data.trang_thai === TRANG_THAI_BAO_CAO_SO_CHE.KHOA
    ? t('baoCaoSoChe.trangThai.khoa')
    : t('baoCaoSoChe.trangThai.mo');
}

/** Các dòng tổng quan — mỗi dòng tối đa 4 cặp nhãn/giá trị. */
export function getBcscPreviewOverviewRows(
  data: FarmBaoCaoSoChe,
  t: TFunction
): BcscPreviewField[][] {
  const status = bcscTrangThaiLabel(data, t);
  const rows: BcscPreviewField[][] = [
    [
      { label: t('baoCaoSoChe.form.ngay'), value: formatDateShort(data.ngay) },
      { label: t('baoCaoSoChe.form.branch'), value: data.ten_chi_nhanh?.trim() || '—' },
      { label: t('baoCaoSoChe.store.colTrangThai'), value: status },
      { label: t('baoCaoSoChe.form.donViTinh'), value: data.don_vi_tinh?.trim() || '—' },
    ],
    [
      { label: t('baoCaoSoChe.store.colSoChe'), value: formatNumberVN(data.tong_buong_so_che), bold: true },
      { label: t('baoCaoSoChe.store.colTonDau'), value: formatNumberVN(data.sl_buong_ton_dau_ngay) },
      { label: t('baoCaoSoChe.store.colThuHoach'), value: formatNumberVN(data.tong_buong_thu_hoach) },
      { label: t('baoCaoSoChe.store.colTonCuoi'), value: formatNumberVN(data.sl_buong_ton_cuoi_ngay) },
    ],
    [
      { label: t('baoCaoSoChe.store.colNguoiTao'), value: data.ten_nguoi_tao?.trim() || '—' },
    ],
  ];
  if (data.ghi_chu?.trim()) {
    rows.push([{ label: t('baoCaoSoChe.form.ghiChuPhieu'), value: data.ghi_chu.trim() }]);
  }
  return rows;
}

const SIGN_KEYS = [
  'baoCaoSoChe.preview.signCreator',
  'baoCaoSoChe.preview.signSupervisor',
  'baoCaoSoChe.preview.signManager',
  'baoCaoSoChe.preview.signApprover',
] as const;

export function getBcscPreviewSignLabels(t: TFunction): string[] {
  return SIGN_KEYS.map((k) => t(k));
}
