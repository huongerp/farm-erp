/**
 * Xuất báo cáo nhân công (PDF / DOC / XLSX) — A4 dọc.
 */
import type { FarmBaoCaoNhanCong, FarmBaoCaoNhanCongCt } from '../core/types';
import { chuyenTtLabelByThuTu, normalizeChiTietForDisplay, sumSlCongNgay, sumSlCongNua, sumSlTangCa, sumSoGioTc, sumTongCongQuyDoiPhieu, sumTongCongQuyDoiTuChiTiet, sumTongGioTangCaTichPhieu, sumTongGioTangCaTichTuChiTiet, tongCongQuyDoiNgayVaNua, tongGioTangCaTichMotDong } from '../core/types';
import { combinedRowGhiChuAtIndex, displayLoaiTotalsOnCt, formatGioTbVN, hasSubLinesOnCt, isSubFormRowEmpty, subAlignedRowCount, subByLoaiForCtDisplay, sumDisplayLoaiTotalsOnRows, sumTongGioQuyDoiRowIVFromRows, tongGioCongNgayVaNua } from '../core/ct-sub';
import { formatDateShort, getTodayISODate } from '../../../../lib/utils';
import i18n from '../../../../lib/i18n';
import { useUIStore } from '../../../../store/useStore';
import { bcncTrangThaiLabel, getBcncPreviewSignLabels } from '../core/bcnc-preview-layout';

const EMPTY = '—';

function safe(v: string | number | null | undefined): string {
  if (v == null || v === '') return EMPTY;
  return String(v);
}

export function fileName(data: FarmBaoCaoNhanCong): string {
  const branch = (data.ten_chi_nhanh ?? 'chi_nhanh')
    .replace(/\s+/g, '_')
    .replace(/[^\w\u00C0-\u024F\-_]/gi, '');
  return `Bao_cao_nhan_cong_${data.ngay}_${branch}_${getTodayISODate()}`;
}

function tableHeaders(t: (k: string) => string): string[] {
  return [
    t('baoCaoNhanCong.form.colTt'),
    t('baoCaoNhanCong.form.colChuyen'),
    `${t('baoCaoNhanCong.form.colSlNgay')} - ${t('baoCaoNhanCong.detail.colNhanSu')}`,
    `${t('baoCaoNhanCong.form.colSlNgay')} - ${t('baoCaoNhanCong.form.colGioTb')}`,
    `${t('baoCaoNhanCong.form.colSlNua')} - ${t('baoCaoNhanCong.detail.colNhanSu')}`,
    `${t('baoCaoNhanCong.form.colSlNua')} - ${t('baoCaoNhanCong.form.colGioTb')}`,
    t('baoCaoNhanCong.form.colTongCongQuyDoi'),
    t('baoCaoNhanCong.form.colTongGio'),
    `${t('baoCaoNhanCong.form.colSlTangCa')} - ${t('baoCaoNhanCong.detail.colNhanSu')}`,
    `${t('baoCaoNhanCong.form.colSlTangCa')} - ${t('baoCaoNhanCong.form.colGioTb')}`,
    t('baoCaoNhanCong.form.colTongGioTc'),
    t('baoCaoNhanCong.form.colGhiChu'),
  ];
}

function mainRowXlsx(
  row: FarmBaoCaoNhanCongCt,
  t: (k: string, o?: Record<string, unknown>) => string,
  tt?: string,
  idx?: number
): (string | number)[] {
  const labelKey = `baoCaoNhanCong.chuyen.${row.loai_chuyen}`;
  const displayTt =
    tt ?? chuyenTtLabelByThuTu(row.thu_tu && row.thu_tu > 0 ? row.thu_tu : (idx ?? 0) + 1);
  const cnNgay = displayLoaiTotalsOnCt(row, 'CN_NGAY');
  const cnNua = displayLoaiTotalsOnCt(row, 'CN_NUA');
  const tc = displayLoaiTotalsOnCt(row, 'TANG_CA');
  return [
    displayTt,
    t(labelKey),
    cnNgay.nhanSu,
    formatGioTbVN(cnNgay.nhanSu, cnNgay.tongGio),
    cnNua.nhanSu,
    formatGioTbVN(cnNua.nhanSu, cnNua.tongGio),
    tongCongQuyDoiNgayVaNua(row),
    tongGioCongNgayVaNua(cnNgay, cnNua),
    tc.nhanSu,
    formatGioTbVN(tc.nhanSu, tc.tongGio),
    tongGioTangCaTichMotDong(row),
    row.ghi_chu?.trim() ?? '',
  ];
}

function subRowXlsx(
  row: FarmBaoCaoNhanCongCt,
  t: (k: string, o?: Record<string, unknown>) => string
): (string | number)[][] {
  if (!hasSubLinesOnCt(row)) return [];
  const sub = subByLoaiForCtDisplay(row);
  const rowCount = subAlignedRowCount(sub);
  const out: (string | number)[][] = [];
  for (let i = 0; i < rowCount; i++) {
    const ghiChu = combinedRowGhiChuAtIndex(sub, i);
    const ng = sub.CN_NGAY[i];
    const nu = sub.CN_NUA[i];
    const tc = sub.TANG_CA[i];
    const sl = (line: { sl_cong: number; so_gio: number } | undefined) =>
      line != null && !isSubFormRowEmpty(line) ? Number(line.sl_cong) : '';
    const gio = (line: { sl_cong: number; so_gio: number } | undefined) =>
      line != null && !isSubFormRowEmpty(line) ? Number(line.so_gio) : '';
    out.push([
      '·',
      t('baoCaoNhanCong.sub.detailRow', { index: i + 1 }),
      sl(ng),
      gio(ng),
      sl(nu),
      gio(nu),
      '',
      '',
      sl(tc),
      gio(tc),
      '',
      ghiChu,
    ]);
  }
  return out;
}

export async function exportBaoCaoNhanCongToXLSX(data: FarmBaoCaoNhanCong): Promise<void> {
  const XLSX = await import('xlsx');
  const t = i18n.t.bind(i18n);
  const info = useUIStore.getState().companyInfo;
  const status = bcncTrangThaiLabel(data, t);
  const { production, vRow } = normalizeChiTietForDisplay(data.chi_tiet ?? []);

  const rows: (string | number)[][] = [
    [info.companyName],
    ...(info.address ? [[t('company.address'), info.address]] : []),
    [],
    [t('baoCaoNhanCong.preview.title')],
    [t('baoCaoNhanCong.form.ngay'), formatDateShort(data.ngay)],
    [t('baoCaoNhanCong.form.branch'), safe(data.ten_chi_nhanh)],
    [t('baoCaoNhanCong.store.colTrangThai'), status],
    [t('baoCaoNhanCong.store.colTongCongNgay'), sumSlCongNgay(data)],
    [t('baoCaoNhanCong.store.colTongCongNua'), sumSlCongNua(data)],
    [t('baoCaoNhanCong.store.colTongCongQuyDoi'), sumTongCongQuyDoiPhieu(data)],
    [t('baoCaoNhanCong.store.colTongTangCa'), sumSlTangCa(data)],
    [t('baoCaoNhanCong.store.colGioTangCa'), sumSoGioTc(data)],
    [t('baoCaoNhanCong.store.colTongGioTangCa'), sumTongGioTangCaTichPhieu(data)],
    [t('baoCaoNhanCong.store.colNguoiTao'), safe(data.ten_nguoi_tao)],
    ...(data.ghi_chu?.trim() ? [[t('baoCaoNhanCong.form.ghiChuPhieu'), data.ghi_chu]] : []),
    [],
    tableHeaders(t),
  ];

  production.forEach((row, idx) => {
    rows.push(mainRowXlsx(row, t, undefined, idx));
    rows.push(...subRowXlsx(row, t));
  });

  const ivCnNgay = sumDisplayLoaiTotalsOnRows(production, 'CN_NGAY');
  const ivCnNua = sumDisplayLoaiTotalsOnRows(production, 'CN_NUA');
  const ivTangCa = sumDisplayLoaiTotalsOnRows(production, 'TANG_CA');
  rows.push([
    'IV',
    t('baoCaoNhanCong.form.rowCongNhanDinhBien'),
    ivCnNgay.nhanSu,
    formatGioTbVN(ivCnNgay.nhanSu, ivCnNgay.tongGio),
    ivCnNua.nhanSu,
    formatGioTbVN(ivCnNua.nhanSu, ivCnNua.tongGio),
    sumTongCongQuyDoiTuChiTiet(production),
    sumTongGioQuyDoiRowIVFromRows(production),
    ivTangCa.nhanSu,
    formatGioTbVN(ivTangCa.nhanSu, ivTangCa.tongGio),
    sumTongGioTangCaTichTuChiTiet(production),
    '',
  ]);

  rows.push(mainRowXlsx(vRow, t, 'V'));
  rows.push(...subRowXlsx(vRow, t));

  const tongCnNgay = sumDisplayLoaiTotalsOnRows(data.chi_tiet ?? [], 'CN_NGAY');
  const tongCnNua = sumDisplayLoaiTotalsOnRows(data.chi_tiet ?? [], 'CN_NUA');
  const tongTangCa = sumDisplayLoaiTotalsOnRows(data.chi_tiet ?? [], 'TANG_CA');
  rows.push([
    '',
    t('baoCaoNhanCong.form.rowTongNgay'),
    tongCnNgay.nhanSu,
    formatGioTbVN(tongCnNgay.nhanSu, tongCnNgay.tongGio),
    tongCnNua.nhanSu,
    formatGioTbVN(tongCnNua.nhanSu, tongCnNua.tongGio),
    sumTongCongQuyDoiPhieu(data),
    tongGioCongNgayVaNua(tongCnNgay, tongCnNua),
    tongTangCa.nhanSu,
    formatGioTbVN(tongTangCa.nhanSu, tongTangCa.tongGio),
    sumTongGioTangCaTichPhieu(data),
    '',
  ]);

  rows.push([]);
  rows.push(getBcncPreviewSignLabels(t));

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [
    { wch: 6 },
    { wch: 28 },
    { wch: 8 },
    { wch: 8 },
    { wch: 8 },
    { wch: 8 },
    { wch: 10 },
    { wch: 10 },
    { wch: 8 },
    { wch: 8 },
    { wch: 10 },
    { wch: 24 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Bao_cao_nhan_cong');
  XLSX.writeFile(wb, `${fileName(data)}.xlsx`);
}
