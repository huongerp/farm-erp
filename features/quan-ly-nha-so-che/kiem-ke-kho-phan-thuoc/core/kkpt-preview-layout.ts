/**
 * Layout chung cho in / xuất phiếu kiểm kê kho:
 * stats, format số lượng, nhãn chữ ký, HTML builders (bảng chi tiết + footer ký).
 * Dùng chung giữa React preview (trình duyệt in) và HTML export (PDF/DOC).
 */
import type { TFunction } from 'i18next';
import type { ChiTietKiemKePT, DotKiemKePT } from './types';
import { formatNumberVN, formatDate } from '../../../../lib/utils';
import { getTrangThaiDotLabelPT, getKetQuaLabelPT } from './constants';

/* ------------------------------------------------------------------ */
/*  Thống kê chi tiết                                                  */
/* ------------------------------------------------------------------ */

export interface KiemKeKhoPTChiTietStats {
  total: number;
  khop: number;
  thieu: number;
  thua: number;
  chuaKiem: number;
}

export function getKiemKeKhoPTChiTietStats(chiTiet: ChiTietKiemKePT[]): KiemKeKhoPTChiTietStats {
  return {
    total: chiTiet.length,
    khop: chiTiet.filter((c) => c.ket_qua === 'khop').length,
    thieu: chiTiet.filter((c) => c.ket_qua === 'thieu').length,
    thua: chiTiet.filter((c) => c.ket_qua === 'thua').length,
    chuaKiem: chiTiet.filter((c) => c.ket_qua === 'chua_kiem').length,
  };
}

/* ------------------------------------------------------------------ */
/*  Format số                                                          */
/* ------------------------------------------------------------------ */

export function formatKiemKeKhoPTQty(value: number | null | undefined, unit?: string | null): string {
  if (value == null) return '—';
  return `${formatNumberVN(value)}${unit ? ` ${unit}` : ''}`;
}

export function getKiemKeKhoVariance(row: ChiTietKiemKePT): number | null {
  if (row.so_luong_thuc_te == null) return null;
  return Number(row.so_luong_thuc_te) - Number(row.so_luong_so);
}

/* ------------------------------------------------------------------ */
/*  Nhãn chữ ký                                                       */
/* ------------------------------------------------------------------ */

const SIGN_KEYS = [
  'kiemKeKhoPT.preview.signInCharge',
  'kiemKeKhoPT.preview.signCounter',
  'kiemKeKhoPT.preview.signWarehouseKeeper',
  'kiemKeKhoPT.preview.signApprover',
] as const;

export function getKiemKeKhoPreviewSignLabels(t: TFunction): string[] {
  return SIGN_KEYS.map((k) => t(k));
}

/* ------------------------------------------------------------------ */
/*  Stats line (văn bản tóm tắt)                                      */
/* ------------------------------------------------------------------ */

export function buildKiemKeKhoStatsText(stats: KiemKeKhoPTChiTietStats, t: TFunction): string {
  return [
    `${t('kiemKeKhoPT.stats.total')}: ${formatNumberVN(stats.total, { maxFractionDigits: 0 })}`,
    `${t('kiemKeKhoPT.ketQua.khop')}: ${formatNumberVN(stats.khop, { maxFractionDigits: 0 })}`,
    `${t('kiemKeKhoPT.ketQua.thieu')}: ${formatNumberVN(stats.thieu, { maxFractionDigits: 0 })}`,
    `${t('kiemKeKhoPT.ketQua.thua')}: ${formatNumberVN(stats.thua, { maxFractionDigits: 0 })}`,
    `${t('kiemKeKhoPT.ketQua.chua_kiem')}: ${formatNumberVN(stats.chuaKiem, { maxFractionDigits: 0 })}`,
  ].join(' · ');
}

/* ------------------------------------------------------------------ */
/*  HTML builders (dùng cho PDF / DOC export)                         */
/* ------------------------------------------------------------------ */

function escHtml(v: string | number | null | undefined): string {
  if (v == null || v === '') return '—';
  return String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Bảng chi tiết 8 cột cho export HTML. */
export function buildKiemKeKhoDetailTableHTML(
  chiTiet: ChiTietKiemKePT[],
  t: TFunction,
  font: string
): string {
  if (chiTiet.length === 0) return '';

  const th = `padding:6px 8px;border:1px solid #ddd;text-align:left;font-size:9pt;font-family:${font};background:#3b82f6;color:#fff`;
  const thR = `${th};text-align:right`;

  const colHeaders = [
    { label: 'TT', style: `${th};text-align:center;width:4%` },
    { label: t('kiemKeKhoPT.store.khoCol'), style: `${th};width:12%` },
    { label: t('kiemKeKhoPT.store.hangHoaCol'), style: `${th};width:22%` },
    { label: t('kiemKeKhoPT.store.soLuongSoCol'), style: `${thR};width:10%` },
    { label: t('kiemKeKhoPT.store.soLuongThucTeCol'), style: `${thR};width:10%` },
    { label: t('kiemKeKhoPT.detail.chenhLech'), style: `${thR};width:10%` },
    { label: t('kiemKeKhoPT.store.ketQuaCol'), style: `${th};width:10%` },
    { label: t('kiemKeKhoPT.store.ghiChuCol'), style: `${th};width:22%` },
  ];

  const thead = `<thead><tr>${colHeaders.map((h) => `<th style="${h.style}">${escHtml(h.label)}</th>`).join('')}</tr></thead>`;

  const td = `padding:4px 8px;border:1px solid #ddd;font-family:${font};font-size:9pt`;
  const tdR = `${td};text-align:right`;
  const tdC = `${td};text-align:center`;

  const tbody = chiTiet
    .map((c, idx) => {
      const variance = getKiemKeKhoVariance(c);
      const varianceStr =
        variance == null
          ? '—'
          : variance > 0
            ? `+${escHtml(formatNumberVN(variance))}`
            : escHtml(formatNumberVN(variance));
      return `<tr>
        <td style="${tdC}">${idx + 1}</td>
        <td style="${td}">${escHtml(c.ten_kho || c.ma_kho)}</td>
        <td style="${td}">${escHtml(c.ten_hang || c.ma_hang)}</td>
        <td style="${tdR}">${escHtml(formatKiemKeKhoPTQty(c.so_luong_so, c.don_vi_tinh))}</td>
        <td style="${tdR}">${escHtml(formatKiemKeKhoPTQty(c.so_luong_thuc_te, c.don_vi_tinh))}</td>
        <td style="${tdR}">${varianceStr}</td>
        <td style="${td}">${escHtml(getKetQuaLabelPT(c.ket_qua, t))}</td>
        <td style="${td}">${escHtml(c.ghi_chu_dong)}</td>
      </tr>`;
    })
    .join('');

  return `<table style="width:100%;border-collapse:collapse;margin-top:12px;font-family:${font};font-size:10pt;table-layout:fixed">
  ${thead}
  <tbody>${tbody}</tbody>
</table>`;
}

/** Footer ký 4 ô cho export HTML. */
export function buildKiemKeKhoSignFooterHTML(t: TFunction, font: string): string {
  const hint = t('kiemKeKhoPT.preview.signHint');
  const blocks = getKiemKeKhoPreviewSignLabels(t)
    .map(
      (label) =>
        `<div style="text-align:center;flex:1"><p style="font-size:10pt;font-weight:600;color:#333;margin:0 0 2px;font-family:${font}">${escHtml(label)}</p><p style="font-size:8pt;color:#666;margin:0;font-family:${font}">${hint}</p></div>`
    )
    .join('');
  return `<div style="display:flex;gap:16px;margin-top:32px;padding-top:16px;border-top:1px solid #ccc;font-family:${font}">${blocks}</div>`;
}

/** Thông tin đợt cho export HTML (dùng giống info table ở preview). */
export function buildKiemKeKhoDotInfoTableHTML(dot: DotKiemKePT, t: TFunction, font: string): string {
  const td1 = `padding:4px 6px;border:1px solid #ddd;font-weight:600;width:40%;color:#444;font-family:${font};font-size:10pt`;
  const td2 = `padding:4px 6px;border:1px solid #ddd;font-family:${font};font-size:10pt`;
  const th = `padding:6px;text-align:left;font-size:9pt;background:#3b82f6;color:#fff;font-family:${font}`;

  const rows = [
    [t('kiemKeKhoPT.store.maDotCol'), dot.ma_dot],
    [t('kiemKeKhoPT.store.tenDotCol'), dot.ten_dot],
    [t('kiemKeKhoPT.store.ngayBatDauCol'), formatDate(dot.ngay_bat_dau)],
    [t('kiemKeKhoPT.store.ngayKetThucCol'), formatDate(dot.ngay_ket_thuc)],
    [t('kiemKeKhoPT.store.trangThaiCol'), getTrangThaiDotLabelPT(dot.trang_thai, t)],
    [t('kiemKeKhoPT.store.nguoiPhuTrachCol'), dot.ten_nguoi_phu_trach || dot.ma_nguoi_phu_trach || '—'],
    [t('kiemKeKhoPT.store.ghiChuCol'), dot.ghi_chu ?? '—'],
  ];

  const bodyHtml = rows
    .map(([l, v]) => `<tr><td style="${td1}">${escHtml(l)}</td><td style="${td2}">${escHtml(v)}</td></tr>`)
    .join('');

  return `<table style="width:100%;border-collapse:collapse;margin-top:12px;font-family:${font};font-size:10pt">
  <thead><tr style="background:#3b82f6;color:#fff"><th colspan="2" style="${th}">${escHtml(t('kiemKeKhoPT.form.infoSection'))}</th></tr></thead>
  <tbody>${bodyHtml}</tbody>
</table>`;
}
