/**
 * Xuất Excel bảng phẳng cho tab «Tổng hợp tuần» (1 dòng / lô) và «So sánh tháng» (1 dòng / tháng × chi nhánh)
 * qua ExportDialog. Chỉ đổi mô hình đã gom ở core/tong-hop thành dòng — không tự cộng lại số.
 */
import type { TFunction } from 'i18next';
import type { ExportColumn } from '../../../../components/shared/LazyExportDialog';
import { formatYmdToDisplay } from '../../../../lib/utils';
import { tiLeKsc, type DgdvSoSanhThang, type DgdvThangChiNhanh, type DgdvTongHopTuan } from '../core/tong-hop';

/** Số / % làm tròn 1 chữ số; không tính được → '' (ô trống). */
const pt = (v: number | null) => (v == null ? '' : Math.round(v * 10) / 10);

/** «Th 10/2026» từ '2026-10'. */
export const nhanThang = (thang: string, t: TFunction) =>
  t('danhGiaDauVao.thang.nhanThang', { thang: Number(thang.slice(5, 7)), nam: thang.slice(0, 4) });

// ---- Tuần ------------------------------------------------------------------------

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
