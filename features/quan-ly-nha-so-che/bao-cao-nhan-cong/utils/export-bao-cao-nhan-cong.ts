/**
 * Xuất XLSX một báo cáo nhân công theo nội dung in: sheet bảng chuyền, sheet danh sách tên, hoặc cả hai.
 */
import type { FarmBaoCaoNhanCong, FarmBaoCaoNhanCongCt } from '../core/types';
import { ghiXlsxCoBangHinh } from '../../../../lib/export/xlsx-bang-hinh';
import { chuyenTtLabelByThuTu, normalizeChiTietForDisplay, sumSlCongNgay, sumSlCongNua, sumSlTangCa, sumSoGioTc, sumTongCongQuyDoiPhieu, sumTongCongQuyDoiTuChiTiet, sumTongGioTangCaTichPhieu, sumTongGioTangCaTichTuChiTiet, tongCongQuyDoiNgayVaNua, tongGioTangCaTichMotDong } from '../core/types';
import { combinedRowGhiChuAtIndex, displayLoaiTotalsOnCt, formatGioTbVN, hasSubLinesOnCt, isSubFormRowEmpty, subAlignedRowCount, subByLoaiForCtDisplay, sumDisplayLoaiTotalsOnRows, sumTongGioQuyDoiRowIVFromRows, tongGioCongNgayVaNua } from '../core/ct-sub';
import { formatYmdToDisplay, getTodayISODate } from '../../../../lib/utils';
import i18n from '../../../../lib/i18n';
import { useUIStore } from '../../../../store/useStore';
import { bcncTrangThaiLabel, getBcncPreviewSignLabels } from '../core/bcnc-preview-layout';
import { tenFileAnToan } from '../../../../lib/phieu-in/ten-file';
import type { NoiDungIn } from '../core/preview-url';
import { nhomNhanVienTheoChuyen } from '../core/danh-sach-nv';

type XlsxModule = typeof import('xlsx');
type Aoa = (string | number)[][];

const EMPTY = '—';

function safe(v: string | number | null | undefined): string {
  if (v == null || v === '') return EMPTY;
  return String(v);
}

export function fileName(data: FarmBaoCaoNhanCong): string {
  const branch = tenFileAnToan(data.ten_chi_nhanh ?? 'chi_nhanh');
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

/** Đầu sheet: công ty + tiêu đề + thông tin phiếu + số tổng. */
function dongDauPhieu(data: FarmBaoCaoNhanCong, tieuDe: string): Aoa {
  const t = i18n.t.bind(i18n);
  const info = useUIStore.getState().companyInfo;
  const status = bcncTrangThaiLabel(data, t);
  return [
    [info.companyName],
    ...(info.address ? [[t('company.address'), info.address]] : []),
    [],
    [tieuDe],
    [t('baoCaoNhanCong.form.ngay'), formatYmdToDisplay(data.ngay?.slice(0, 10))],
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
  ];
}

function sheetChuyen(XLSX: XlsxModule, data: FarmBaoCaoNhanCong) {
  const t = i18n.t.bind(i18n);
  const { production, vRow } = normalizeChiTietForDisplay(data.chi_tiet ?? []);
  const rows: Aoa = [...dongDauPhieu(data, t('baoCaoNhanCong.preview.title')), tableHeaders(t)];

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
  return ws;
}

/** Danh sách tên dạng phẳng (mỗi người một dòng, có cột chuyền) — lọc/sắp được trong Excel. */
function sheetNhanVien(XLSX: XlsxModule, data: FarmBaoCaoNhanCong) {
  const t = i18n.t.bind(i18n);
  const rows: Aoa = [
    ...dongDauPhieu(data, t('baoCaoNhanCong.preview.tieuDeDanhSachNv')),
    [
      t('baoCaoNhanCong.nv.stt'),
      t('baoCaoNhanCong.form.colTt'),
      t('baoCaoNhanCong.form.colChuyen'),
      t('baoCaoNhanCong.nv.hoTen'),
      t('baoCaoNhanCong.nv.viTri'),
      t('baoCaoNhanCong.nv.cong'),
      t('baoCaoNhanCong.nv.gioCong'),
      t('baoCaoNhanCong.nv.gioTc'),
      t('baoCaoNhanCong.form.colGhiChu'),
    ],
  ];
  let stt = 0;
  for (const { ct, tt, nhanVien } of nhomNhanVienTheoChuyen(data)) {
    for (const nv of nhanVien) {
      stt += 1;
      rows.push([
        stt,
        tt,
        t(`baoCaoNhanCong.chuyen.${ct.loai_chuyen}`),
        nv.ho_ten,
        nv.vi_tri ?? '',
        t(`baoCaoNhanCong.nv.chamCong.${nv.cham_cong}`),
        Number(nv.so_gio_cong),
        Number(nv.so_gio_tc),
        nv.ghi_chu ?? '',
      ]);
    }
  }
  rows.push(['', '', t('baoCaoNhanCong.nv.tongNguoi', { n: stt })]);
  rows.push([]);
  rows.push(getBcncPreviewSignLabels(t));

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 5 }, { wch: 5 }, { wch: 30 }, { wch: 26 }, { wch: 22 }, { wch: 10 }, { wch: 9 }, { wch: 9 }, { wch: 24 }];
  return ws;
}

export async function exportBaoCaoNhanCongToXLSX(data: FarmBaoCaoNhanCong, noiDung: NoiDungIn = 'ca-hai'): Promise<void> {
  const XLSX = await import('xlsx');
  const coTen = nhomNhanVienTheoChuyen(data).length > 0;
  const wb = XLSX.utils.book_new();
  if (noiDung !== 'nhan-vien') XLSX.utils.book_append_sheet(wb, sheetChuyen(XLSX, data), 'Bao_cao_nhan_cong');
  if (noiDung !== 'chuyen' && coTen) XLSX.utils.book_append_sheet(wb, sheetNhanVien(XLSX, data), 'Danh_sach_NV');
  if (wb.SheetNames.length === 0) XLSX.utils.book_append_sheet(wb, sheetChuyen(XLSX, data), 'Bao_cao_nhan_cong');
  await ghiXlsxCoBangHinh(XLSX, wb, `${fileName(data)}.xlsx`);
}
