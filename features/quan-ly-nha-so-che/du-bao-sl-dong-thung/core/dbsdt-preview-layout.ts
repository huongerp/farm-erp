/**
 * Layout chung cho in / xuất phiếu dự báo SL đóng thùng: tổng quan + footer chữ ký.
 */
import type { TFunction } from 'i18next';
import type { FarmDuBaoSlDongThung } from './types';
import { TRANG_THAI_DU_BAO_SL_DONG_THUNG } from './types';
import { formatDateShort } from '../../../../lib/utils';

export type DbsdtPreviewField = { label: string; value: string; bold?: boolean };

export function dbsdtTrangThaiLabel(data: FarmDuBaoSlDongThung, t: TFunction): string {
  return data.trang_thai === TRANG_THAI_DU_BAO_SL_DONG_THUNG.KHOA
    ? t('duBaoSlDongThung.trangThai.khoa')
    : t('duBaoSlDongThung.trangThai.mo');
}

/** Các dòng tổng quan — mỗi dòng tối đa 4 cặp nhãn/giá trị. */
export function getDbsdtPreviewOverviewRows(
  data: FarmDuBaoSlDongThung,
  t: TFunction
): DbsdtPreviewField[][] {
  const status = dbsdtTrangThaiLabel(data, t);
  const rows: DbsdtPreviewField[][] = [
    [
      { label: t('duBaoSlDongThung.form.ngay'), value: formatDateShort(data.ngay) },
      { label: t('duBaoSlDongThung.form.branch'), value: data.ten_chi_nhanh?.trim() || '—' },
      { label: t('duBaoSlDongThung.store.colTrangThai'), value: status },
      { label: t('duBaoSlDongThung.store.colNguoiTao'), value: data.ten_nguoi_tao?.trim() || '—' },
    ],
  ];
  if (data.ghi_chu?.trim()) {
    rows.push([{ label: t('duBaoSlDongThung.form.ghiChuPhieu'), value: data.ghi_chu.trim() }]);
  }
  return rows;
}

const SIGN_KEYS = [
  'duBaoSlDongThung.preview.signCreator',
  'duBaoSlDongThung.preview.signSupervisor',
  'duBaoSlDongThung.preview.signManager',
  'duBaoSlDongThung.preview.signApprover',
] as const;

export function getDbsdtPreviewSignLabels(t: TFunction): string[] {
  return SIGN_KEYS.map((k) => t(k));
}
