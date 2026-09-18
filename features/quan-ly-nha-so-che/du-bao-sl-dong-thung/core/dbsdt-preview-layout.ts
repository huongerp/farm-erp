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

export function buildDbsdtOverviewTableHTML(
  data: FarmDuBaoSlDongThung,
  t: TFunction,
  font: string
): string {
  const rows = getDbsdtPreviewOverviewRows(data, t);
  const cell = (f: DbsdtPreviewField) => {
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

export function buildDbsdtSignFooterHTML(t: TFunction, font: string): string {
  const hint = t('duBaoSlDongThung.preview.signHint');
  const blocks = getDbsdtPreviewSignLabels(t)
    .map(
      (label) =>
        `<div style="text-align:center;flex:1"><p style="font-size:9pt;font-weight:600;color:#333;margin:0 0 2px;font-family:${font}">${label}</p><p style="font-size:7.5pt;color:#666;margin:0;font-family:${font}">${hint}</p></div>`
    )
    .join('');
  return `<div style="display:flex;gap:12px;margin-top:24px;padding-top:12px;border-top:1px solid #ccc;font-family:${font}">${blocks}</div>`;
}
