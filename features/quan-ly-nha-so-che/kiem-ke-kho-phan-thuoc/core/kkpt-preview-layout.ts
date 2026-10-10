/**
 * Layout chung cho in / xuất phiếu kiểm kê kho:
 * stats, format số lượng, nhãn chữ ký, HTML builders (bảng chi tiết + footer ký).
 * Dùng chung giữa React preview (trình duyệt in) và HTML export (PDF/DOC).
 */
import type { TFunction } from 'i18next';
import type { ChiTietKiemKePT } from './types';
import { formatNumberVN } from '../../../../lib/utils';

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
