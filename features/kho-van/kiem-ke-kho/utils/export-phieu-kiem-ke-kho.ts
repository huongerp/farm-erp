/**
 * Xuất phiếu kiểm kê kho đợt ra XLSX (SheetJS aoa_to_sheet). PDF / DOC tải từ chính bản
 * xem trước qua khung in dùng chung (components/shared/phieu-in/PhieuInPage).
 */
import type { DotKiemKeKho, ChiTietKiemKeKho } from '../core/types';
import { formatDate, getTodayISODate } from '../../../../lib/utils';
import i18n from '../../../../lib/i18n';
import { useUIStore } from '../../../../store/useStore';
import { getTrangThaiDotLabel } from '../core/constants';
import { getKiemKeKhoChiTietStats, getKiemKeKhoPreviewSignLabels, getKiemKeKhoVariance } from '../core/kkk-preview-layout';

function safeText(v: string | number | null | undefined): string {
  if (v == null || v === '') return '—';
  return String(v);
}

export function getFileName(dot: DotKiemKeKho): string {
  const slug = `${dot.ma_dot}_${dot.ten_dot}`.replace(/\s+/g, '_').replace(/[^\w\u00C0-\u024F\-_]/gi, '');
  return `Phieu_kiem_ke_kho_${slug}_${getTodayISODate()}`;
}

/* ------------------------------------------------------------------ */
/*  Export: XLSX                                                       */
/* ------------------------------------------------------------------ */

export async function exportPhieuKiemKeKhoToXLSX(
  dot: DotKiemKeKho,
  chiTiet: ChiTietKiemKeKho[]
): Promise<void> {
  const XLSX = await import('xlsx');
  const t = i18n.t.bind(i18n);
  const info = useUIStore.getState().companyInfo;
  const stats = getKiemKeKhoChiTietStats(chiTiet);
  const signLabels = getKiemKeKhoPreviewSignLabels(t);

  const rows: (string | number)[][] = [
    [safeText(info.companyName)],
    ...(info.address ? [[t('company.address'), info.address]] : []),
    ...(info.email ? [[t('company.email'), info.email]] : []),
    ...(info.phone ? [[t('company.phone'), info.phone]] : []),
    [],
    [t('kiemKeKho.preview.title')],
    [t('kiemKeKho.store.maDotCol'), dot.ma_dot],
    [t('kiemKeKho.store.tenDotCol'), dot.ten_dot],
    [t('kiemKeKho.store.ngayBatDauCol'), formatDate(dot.ngay_bat_dau)],
    [t('kiemKeKho.store.ngayKetThucCol'), formatDate(dot.ngay_ket_thuc)],
    [t('kiemKeKho.store.trangThaiCol'), getTrangThaiDotLabel(dot.trang_thai, t)],
    [t('kiemKeKho.store.nguoiPhuTrachCol'), safeText(dot.ten_nguoi_phu_trach || dot.ma_nguoi_phu_trach)],
    [t('kiemKeKho.store.ghiChuCol'), safeText(dot.ghi_chu)],
    [],
    [t('kiemKeKho.stats.total'), stats.total],
    [t('kiemKeKho.ketQua.khop'), stats.khop],
    [t('kiemKeKho.ketQua.thieu'), stats.thieu],
    [t('kiemKeKho.ketQua.thua'), stats.thua],
    [t('kiemKeKho.ketQua.chua_kiem'), stats.chuaKiem],
    [],
    [
      'TT',
      t('kiemKeKho.store.khoCol'),
      t('kiemKeKho.store.hangHoaCol'),
      t('kiemKeKho.store.soLuongSoCol'),
      t('kiemKeKho.store.soLuongThucTeCol'),
      t('kiemKeKho.detail.chenhLech'),
      t('kiemKeKho.store.ketQuaCol'),
      t('kiemKeKho.store.dvtCol'),
      t('kiemKeKho.store.ghiChuCol'),
    ],
  ];

  chiTiet.forEach((c, idx) => {
    const variance = getKiemKeKhoVariance(c);
    rows.push([
      idx + 1,
      safeText(c.ten_kho || c.ma_kho),
      safeText(c.ten_hang || c.ma_hang),
      Number(c.so_luong_so) || 0,
      c.so_luong_thuc_te != null ? Number(c.so_luong_thuc_te) : '',
      variance ?? '',
      t(`kiemKeKho.ketQua.${c.ket_qua}`),
      safeText(c.don_vi_tinh),
      safeText(c.ghi_chu_dong),
    ]);
  });

  // Phần ký — 4 cột nhãn
  rows.push([], signLabels);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [
    { wch: 8 },
    { wch: 24 },
    { wch: 32 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
    { wch: 10 },
    { wch: 28 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Phieu_kiem_ke_kho');
  XLSX.writeFile(wb, `${getFileName(dot)}.xlsx`);
}
