/**
 * Layout chung cho in / xuất báo cáo nhân công: tổng quan nhiều cột + footer chữ ký.
 */
import type { TFunction } from 'i18next';
import type { FarmBaoCaoNhanCong } from './types';
import {
  TRANG_THAI_BAO_CAO_NHAN_CONG,
  sumSlCongNgay,
  sumSlCongNua,
  sumSlTangCa,
  sumSoGioTc,
  sumTongCongQuyDoiPhieu,
  sumTongGioTangCaTichPhieu,
} from './types';
import { formatDateShort, formatNumberVN } from '../../../../lib/utils';

export type BcncPreviewField = { label: string; value: string; bold?: boolean };

export function bcncTrangThaiLabel(data: FarmBaoCaoNhanCong, t: TFunction): string {
  return data.trang_thai === TRANG_THAI_BAO_CAO_NHAN_CONG.KHOA
    ? t('baoCaoNhanCong.trangThai.khoa')
    : t('baoCaoNhanCong.trangThai.mo');
}

/** Các dòng tổng quan — mỗi dòng tối đa 4 cặp nhãn/giá trị. */
export function getBcncPreviewOverviewRows(
  data: FarmBaoCaoNhanCong,
  t: TFunction
): BcncPreviewField[][] {
  const status = bcncTrangThaiLabel(data, t);
  const rows: BcncPreviewField[][] = [
    [
      { label: t('baoCaoNhanCong.form.ngay'), value: formatDateShort(data.ngay) },
      { label: t('baoCaoNhanCong.form.branch'), value: data.ten_chi_nhanh?.trim() || '—' },
      { label: t('baoCaoNhanCong.store.colTrangThai'), value: status },
      { label: t('baoCaoNhanCong.store.colNguoiTao'), value: data.ten_nguoi_tao?.trim() || '—' },
    ],
    [
      { label: t('baoCaoNhanCong.store.colTongCongNgay'), value: formatNumberVN(sumSlCongNgay(data)) },
      { label: t('baoCaoNhanCong.store.colTongCongNua'), value: formatNumberVN(sumSlCongNua(data)) },
      {
        label: t('baoCaoNhanCong.store.colTongCongQuyDoi'),
        value: formatNumberVN(sumTongCongQuyDoiPhieu(data)),
        bold: true,
      },
      { label: t('baoCaoNhanCong.store.colTongTangCa'), value: formatNumberVN(sumSlTangCa(data)) },
    ],
    [
      { label: t('baoCaoNhanCong.store.colGioTangCa'), value: formatNumberVN(sumSoGioTc(data)) },
      {
        label: t('baoCaoNhanCong.store.colTongGioTangCa'),
        value: formatNumberVN(sumTongGioTangCaTichPhieu(data)),
        bold: true,
      },
    ],
  ];
  if (data.ghi_chu?.trim()) {
    rows.push([{ label: t('baoCaoNhanCong.form.ghiChuPhieu'), value: data.ghi_chu.trim() }]);
  }
  return rows;
}

const SIGN_KEYS = [
  'baoCaoNhanCong.preview.signCreator',
  'baoCaoNhanCong.preview.signChecker',
  'baoCaoNhanCong.preview.signRelated',
  'baoCaoNhanCong.preview.signApprover',
] as const;

export function getBcncPreviewSignLabels(t: TFunction): string[] {
  return SIGN_KEYS.map((k) => t(k));
}
