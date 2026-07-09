import { getTodayISODate } from '../../../../lib/utils';
import type { BaoCaoDeXuatVatTuFilters } from '../core/types';
import type { TFunction } from 'i18next';
import {
  getTongHopDeXuatKy,
  getPhieuDeXuatInPeriod,
  getLienKetDonHang,
} from '../services/bao-cao-de-xuat-vat-tu-service';

const FILENAME_PREFIX = 'bao_cao_de_xuat_vat_tu';

import { getBaoCaoTrangThaiLabel } from '../core/trang-thai-utils';

function getTrangThaiLabel(trang_thai: string, t: TFunction): string {
  return getBaoCaoTrangThaiLabel(trang_thai, t);
}

export async function exportBaoCaoDeXuatVatTuToExcel(
  filters: BaoCaoDeXuatVatTuFilters,
  t: TFunction
): Promise<void> {
  const [tongHop, chiTietList, lienKetList] = await Promise.all([
    getTongHopDeXuatKy(filters),
    getPhieuDeXuatInPeriod(filters),
    getLienKetDonHang(filters),
  ]);

  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();

  if (tongHop) {
    const colStatus = t('baoCaodeXuatVatTu.tongHop.statusCol');
    const colCount = t('baoCaodeXuatVatTu.tongHop.countCol');
    const byTrangThaiRows = tongHop.byTrangThai.map((r) => ({
      [colStatus]: getTrangThaiLabel(r.trang_thai, t),
      [colCount]: r.count,
    }));
    if (byTrangThaiRows.length > 0) {
      const ws1 = XLSX.utils.json_to_sheet(byTrangThaiRows);
      XLSX.utils.book_append_sheet(wb, ws1, 'TongHop_TrangThai');
    }
    const colNoi = t('baoCaodeXuatVatTu.chiTiet.noiDeXuat');
    const byNoiRows = tongHop.byNoiDeXuat.map((r) => ({
      [colNoi]: r.ten_noi_de_xuat ?? r.id_noi_de_xuat,
      [colCount]: r.count,
    }));
    if (byNoiRows.length > 0) {
      const ws2 = XLSX.utils.json_to_sheet(byNoiRows);
      XLSX.utils.book_append_sheet(wb, ws2, 'TongHop_NoiDeXuat');
    }
  }

  if (chiTietList.length > 0) {
    const colSoPhieu = t('baoCaodeXuatVatTu.chiTiet.soPhieu');
    const colNgay = t('baoCaodeXuatVatTu.chiTiet.ngay');
    const colNgayCan = t('baoCaodeXuatVatTu.chiTiet.ngayCan');
    const colNoiDeXuat = t('baoCaodeXuatVatTu.chiTiet.noiDeXuat');
    const colNguoiDeXuat = t('baoCaodeXuatVatTu.chiTiet.nguoiDeXuat');
    const colNguoiDuyet = t('baoCaodeXuatVatTu.chiTiet.nguoiDuyet');
    const colTrangThai = t('baoCaodeXuatVatTu.chiTiet.trangThai');
    const rows = chiTietList.map((p) => ({
      [colSoPhieu]: p.so_phieu,
      [colNgay]: p.ngay,
      [colNgayCan]: p.ngay_can,
      [colNoiDeXuat]: p.ten_noi_de_xuat ?? '',
      [colNguoiDeXuat]: p.ten_nguoi_de_xuat ?? '',
      [colNguoiDuyet]: p.ten_nguoi_duyet ?? '',
      [colTrangThai]: getTrangThaiLabel(p.trang_thai, t),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'ChiTietPhieu');
  }

  if (lienKetList.length > 0) {
    const colSoPhieu = t('baoCaodeXuatVatTu.lienKet.soPhieu');
    const colNgay = t('baoCaodeXuatVatTu.chiTiet.ngay');
    const colNoiDeXuat = t('baoCaodeXuatVatTu.chiTiet.noiDeXuat');
    const colNguoiDeXuat = t('baoCaodeXuatVatTu.chiTiet.nguoiDeXuat');
    const colTrangThai = t('baoCaodeXuatVatTu.chiTiet.trangThai');
    const colDaChuyen = t('baoCaodeXuatVatTu.lienKet.daChuyenDon');
    const colSoDon = t('baoCaodeXuatVatTu.lienKet.soDonHang');
    const rows = lienKetList.map((r) => ({
      [colSoPhieu]: r.so_phieu,
      [colNgay]: r.ngay,
      [colNoiDeXuat]: r.ten_noi_de_xuat ?? '',
      [colNguoiDeXuat]: r.ten_nguoi_de_xuat ?? '',
      [colTrangThai]: getTrangThaiLabel(r.trang_thai, t),
      [colDaChuyen]: r.da_chuyen_don ? t('baoCaodeXuatVatTu.lienKet.daChuyen') : t('baoCaodeXuatVatTu.lienKet.chuaChuyen'),
      [colSoDon]: r.so_phieu_don ?? '',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'LienKetDonHang');
  }

  if (wb.SheetNames.length === 0) {
    const ws = XLSX.utils.aoa_to_sheet([[t('baoCaodeXuatVatTu.empty')]]);
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
  }

  const periodSuffix = filters.dateFrom && filters.dateTo ? `${filters.dateFrom}_${filters.dateTo}` : 'all';
  XLSX.writeFile(wb, `${FILENAME_PREFIX}_${periodSuffix}_${getTodayISODate()}.xlsx`);
}
