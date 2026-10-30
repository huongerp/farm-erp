/**
 * Xuất Excel bảng phẳng: tab «Tổng hợp tuần» (1 dòng / tuần × chi nhánh như bảng; Detail tuần: 1 dòng / lô) và
 * «So sánh tháng» (1 dòng / tháng × chi nhánh)
 * qua ExportDialog. Chỉ đổi mô hình đã gom ở core/tong-hop thành dòng — không tự cộng lại số.
 */
import type { TFunction } from 'i18next';
import type { ExportColumn } from '../../../../components/shared/LazyExportDialog';
import { formatYmdToDisplay } from '../../../../lib/utils';
import { ghiXlsxCoBangHinh } from '../../../../lib/export/xlsx-bang-hinh';
import { nhanTuanFarm } from '../core/tuan';
import { tiLeKsc, tiLeSoChe, type DgdvSoSanhThang, type DgdvThangChiNhanh, type DgdvTongHopTuan, type DgdvTuanKyDong } from '../core/tong-hop';

/** Số / % làm tròn 1 chữ số; không tính được → '' (ô trống). */
const pt = (v: number | null) => (v == null ? '' : Math.round(v * 10) / 10);

/** «Th 10/2026» từ '2026-10'. */
export const nhanThang = (thang: string, t: TFunction) =>
  t('danhGiaDauVao.thang.nhanThang', { thang: Number(thang.slice(5, 7)), nam: thang.slice(0, 4) });

// ---- Tuần ------------------------------------------------------------------------

/** Cột xuất danh sách tab «Tổng hợp tuần» (kỳ nhiều tuần — cột T2→CN không kèm ngày). */
export function cotXuatTuanKy(t: TFunction): ExportColumn[] {
  return [
    { key: 'tuan', label: t('danhGiaDauVao.store.colNamTuan') },
    { key: 'chi_nhanh', label: t('danhGiaDauVao.tuan.colChiNhanh') },
    { key: 'so_ngay', label: t('danhGiaDauVao.thang.colSoNgay'), type: 'number' },
    { key: 'so_chuyen', label: t('danhGiaDauVao.thang.colSoChuyen'), type: 'number' },
    ...Array.from({ length: 7 }, (_, i) => ({ key: `n${i}`, label: t(`danhGiaDauVao.thu.${i}`), type: 'number' as const })),
    { key: 'tong', label: t('danhGiaDauVao.tuan.colTongTuan'), type: 'number' },
    { key: 'ksc', label: t('danhGiaDauVao.store.colKsc'), type: 'number' },
    { key: 'ti_le', label: t('danhGiaDauVao.store.colTiLeKsc'), type: 'percent' },
    { key: 'so_che', label: t('danhGiaDauVao.store.colSoChe'), type: 'number' },
    { key: 'ti_le_so_che', label: t('danhGiaDauVao.store.colTiLeSoChe'), type: 'percent' },
  ];
}

/** Một dòng / (tuần, chi nhánh) như bảng đang hiện. */
export function dongXuatTuanKy(rows: readonly DgdvTuanKyDong[], tenCn: (id: string) => string): Record<string, unknown>[] {
  return rows.map((r) => ({
    tuan: nhanTuanFarm({ nam: r.nam, tuan: r.tuan }),
    chi_nhanh: tenCn(r.id_chi_nhanh),
    so_ngay: r.soNgayCoSo,
    so_chuyen: r.soChuyen,
    ...Object.fromEntries(r.theoNgay.map((v, i) => [`n${i}`, v])),
    tong: r.tongThu,
    ksc: r.ksc,
    ti_le: pt(tiLeKsc(r.ksc, r.tongThu)),
    so_che: r.soChe ?? '',
    ti_le_so_che: pt(tiLeSoChe(r.soChe, r.thuCoBc)),
  }));
}

export function cotXuatTuan(ngays: readonly string[], t: TFunction): ExportColumn[] {
  return [
    { key: 'chi_nhanh', label: t('danhGiaDauVao.tuan.colChiNhanh') },
    { key: 'to_truong', label: t('danhGiaDauVao.tuan.colToTruong') },
    { key: 'lo', label: t('danhGiaDauVao.luoi.colLo') },
    ...ngays.map((n, i) => ({
      key: `n${i}`,
      label: `${t(`danhGiaDauVao.thu.${i}`)} ${formatYmdToDisplay(n).slice(0, 5)}`,
      type: 'number' as const,
    })),
    { key: 'tong', label: t('danhGiaDauVao.tuan.colTongTuan'), type: 'number' },
    { key: 'ksc', label: t('danhGiaDauVao.store.colKsc'), type: 'number' },
    { key: 'ti_le', label: t('danhGiaDauVao.store.colTiLeKsc'), type: 'percent' },
  ];
}

/** Một dòng / lô (kèm tổ trưởng + chi nhánh), cuối là dòng Tổng cộng. */
export function dongXuatTuan(
  kq: DgdvTongHopTuan,
  tenCn: (id: string) => string,
  t: TFunction
): Record<string, unknown>[] {
  const theoNgay = (ds: number[]) => Object.fromEntries(ds.map((v, i) => [`n${i}`, v]));
  const ds: Record<string, unknown>[] = kq.toTruong.flatMap((g) =>
    g.lo.map((lo) => ({
      chi_nhanh: tenCn(g.id_chi_nhanh),
      to_truong: g.ten_to_truong ?? t('danhGiaDauVao.luoi.chuaCoToTruong'),
      lo: lo.ten_lo ?? '',
      ...theoNgay(lo.theoNgay),
      tong: lo.tongThu,
      ksc: lo.ksc,
      ti_le: pt(tiLeKsc(lo.ksc, lo.tongThu)),
    }))
  );
  if (ds.length > 0) {
    ds.push({
      chi_nhanh: '',
      to_truong: t('danhGiaDauVao.luoi.tongCong'),
      lo: '',
      ...theoNgay(kq.theoNgay),
      tong: kq.tongThu,
      ksc: kq.ksc,
      ti_le: pt(tiLeKsc(kq.ksc, kq.tongThu)),
    });
  }
  return ds;
}

/** Tải nhanh XLSX của phiếu tuần từ đúng mô hình đã gom cho phần in. */
export async function taiXlsxTuan(
  kq: DgdvTongHopTuan,
  ngays: readonly string[],
  tenCn: (id: string) => string,
  tenFile: string,
  t: TFunction
): Promise<boolean> {
  const cot = cotXuatTuan(ngays, t);
  const dong = dongXuatTuan(kq, tenCn, t);
  if (dong.length === 0) return false;
  const XLSX = await import('xlsx');
  const aoa = [
    cot.map((c) => c.label),
    ...dong.map((r) => cot.map((c) => r[c.key] ?? '')),
  ];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = cot.map((c, i) => ({ wch: i < 3 ? 22 : c.key === 'ti_le' ? 12 : 14 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, t('danhGiaDauVao.tabs.tongHopTuan').slice(0, 31));
  await ghiXlsxCoBangHinh(XLSX, wb, `${tenFile}.xlsx`);
  return true;
}

// ---- Tháng -----------------------------------------------------------------------

export function cotXuatThang(t: TFunction): ExportColumn[] {
  return [
    { key: 'thang', label: t('danhGiaDauVao.thang.colThang') },
    { key: 'chi_nhanh', label: t('danhGiaDauVao.tuan.colChiNhanh') },
    { key: 'tong_thu', label: t('danhGiaDauVao.store.colTongThu'), type: 'number' },
    { key: 'ksc', label: t('danhGiaDauVao.store.colKsc'), type: 'number' },
    { key: 'ti_le', label: t('danhGiaDauVao.store.colTiLeKsc'), type: 'percent' },
    { key: 'so_chuyen', label: t('danhGiaDauVao.thang.colSoChuyen'), type: 'number' },
    { key: 'so_ngay', label: t('danhGiaDauVao.thang.colSoNgay'), type: 'number' },
    { key: 'tb_ngay', label: t('danhGiaDauVao.thang.colTbNgay'), type: 'number' },
    { key: 'chenh', label: t('danhGiaDauVao.thang.colChenh'), type: 'number' },
    { key: 'chenh_pt', label: t('danhGiaDauVao.thang.colChenhPt'), type: 'percent' },
  ];
}

/** Tháng × chi nhánh; nhiều chi nhánh thì thêm dòng «Tất cả» sau mỗi tháng. */
export function dongXuatThang(
  kq: DgdvSoSanhThang,
  tenCn: (id: string) => string,
  t: TFunction
): Record<string, unknown>[] {
  const dong = (d: DgdvThangChiNhanh) => ({
    thang: nhanThang(d.thang, t),
    chi_nhanh: d.id_chi_nhanh == null ? t('danhGiaDauVao.thang.tatCaChiNhanh') : tenCn(d.id_chi_nhanh),
    tong_thu: d.tongThu,
    ksc: d.ksc,
    ti_le: pt(tiLeKsc(d.ksc, d.tongThu)),
    so_chuyen: d.soChuyen,
    so_ngay: d.soNgayCoNhap,
    tb_ngay: pt(d.tbThuNgay),
    chenh: d.chenh ?? '',
    chenh_pt: pt(d.chenhPt),
  });
  const coTong = kq.dsChiNhanh.length > 1;
  return kq.tongThang.flatMap((tong) => [
    ...kq.theoChiNhanh.filter((d) => d.thang === tong.thang).map(dong),
    ...(coTong ? [dong(tong)] : []),
  ]);
}
