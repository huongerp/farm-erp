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

export function buildBcncOverviewTableHTML(
  data: FarmBaoCaoNhanCong,
  t: TFunction,
  font: string
): string {
  const rows = getBcncPreviewOverviewRows(data, t);
  const cell = (f: BcncPreviewField) => {
    const val = f.bold ? `<strong>${f.value}</strong>` : f.value;
    return `<td style="padding:4px 6px;border:1px solid #ddd;font-size:8.5pt;font-family:${font};vertical-align:top;width:25%"><span style="font-weight:600;color:#444">${f.label}:</span> ${val}</td>`;
  };
  const body = rows
    .map((fields) => {
      const isFullWidth = fields.length === 1;
      if (isFullWidth) {
        const f = fields[0];
        const val = f.bold ? `<strong>${f.value}</strong>` : f.value;
        return `<tr><td colspan="4" style="padding:4px 6px;border:1px solid #ddd;font-size:8.5pt;font-family:${font}"><span style="font-weight:600;color:#444">${f.label}:</span> <span style="white-space:pre-wrap">${val}</span></td></tr>`;
      }
      const cols = fields.map(cell).join('');
      const pad =
        fields.length < 4
          ? `<td colspan="${4 - fields.length}" style="border:1px solid #ddd;background:#fff"></td>`
          : '';
      return `<tr>${cols}${pad}</tr>`;
    })
    .join('');
  return `<table style="width:100%;border-collapse:collapse;margin-bottom:10px;table-layout:fixed"><tbody>${body}</tbody></table>`;
}

export function buildBcncSignFooterHTML(t: TFunction, font: string): string {
  const hint = t('baoCaoNhanCong.preview.signHint');
  const blocks = getBcncPreviewSignLabels(t)
    .map(
      (label) =>
        `<div style="text-align:center;flex:1"><p style="font-size:9pt;font-weight:600;color:#333;margin:0 0 2px;font-family:${font}">${label}</p><p style="font-size:7.5pt;color:#666;margin:0;font-family:${font}">${hint}</p></div>`
    )
    .join('');
  return `<div style="display:flex;gap:12px;margin-top:24px;padding-top:12px;border-top:1px solid #ccc;font-family:${font}">${blocks}</div>`;
}
