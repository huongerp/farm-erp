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

export function buildBcscOverviewTableHTML(
  data: FarmBaoCaoSoChe,
  t: TFunction,
  font: string
): string {
  const rows = getBcscPreviewOverviewRows(data, t);
  const cell = (f: BcscPreviewField) => {
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

export function buildBcscSignFooterHTML(t: TFunction, font: string): string {
  const hint = t('baoCaoSoChe.preview.signHint');
  const blocks = getBcscPreviewSignLabels(t)
    .map(
      (label) =>
        `<div style="text-align:center;flex:1"><p style="font-size:9pt;font-weight:600;color:#333;margin:0 0 2px;font-family:${font}">${label}</p><p style="font-size:7.5pt;color:#666;margin:0;font-family:${font}">${hint}</p></div>`
    )
    .join('');
  return `<div style="display:flex;gap:12px;margin-top:24px;padding-top:12px;border-top:1px solid #ccc;font-family:${font}">${blocks}</div>`;
}
