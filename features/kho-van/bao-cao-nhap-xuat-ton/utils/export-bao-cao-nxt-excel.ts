import { getTodayISODate } from '../../../../lib/utils';
import type { NXTReportFilters } from '../core/types';
import type { TFunction } from 'i18next';
import { getNXTByPeriod, getPhieuInPeriod, getTonAtDate } from '../services/bao-cao-nxt-service';

const FILENAME_PREFIX = 'bao_cao_nhap_xuat_ton';

export async function exportBaoCaoNXTToExcel(
  filters: NXTReportFilters,
  t: TFunction
): Promise<void> {
  const [nxtResult, phieuList, tonRows] = await Promise.all([
    filters.dateFrom && filters.dateTo ? getNXTByPeriod(filters) : Promise.resolve({ byWarehouse: [], byProduct: [], byCell: [] }),
    filters.dateFrom && filters.dateTo ? getPhieuInPeriod(filters) : Promise.resolve([]),
    getTonAtDate(filters),
  ]);

  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();

  if (nxtResult.byWarehouse.length > 0) {
    const colMaKho = t('baoCaonhapXuatTon.byWarehouse.maKho');
    const colTenKho = t('baoCaonhapXuatTon.byWarehouse.tenKho');
    const colTonDau = t('baoCaonhapXuatTon.byWarehouse.tonDauKy');
    const colNhap = t('baoCaonhapXuatTon.byWarehouse.tongNhap');
    const colXuat = t('baoCaonhapXuatTon.byWarehouse.tongXuat');
    const colTonCuoi = t('baoCaonhapXuatTon.byWarehouse.tonCuoiKy');
    const rows = nxtResult.byWarehouse.map((r) => ({
      [colMaKho]: r.ma_kho,
      [colTenKho]: r.ten_kho,
      [colTonDau]: r.ton_dau_ky,
      [colNhap]: r.tong_nhap,
      [colXuat]: r.tong_xuat,
      [colTonCuoi]: r.ton_cuoi_ky,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'NXT_TheoKho');
  }

  if (nxtResult.byProduct.length > 0) {
    const colMaHang = t('baoCaonhapXuatTon.byProduct.maHang');
    const colTenHang = t('baoCaonhapXuatTon.byProduct.tenHang');
    const colDanhMuc = t('baoCaonhapXuatTon.byProduct.danhMuc');
    const colDVT = t('baoCaonhapXuatTon.byProduct.donViTinh');
    const colTonDau = t('baoCaonhapXuatTon.byProduct.tonDauKy');
    const colNhap = t('baoCaonhapXuatTon.byProduct.tongNhap');
    const colXuat = t('baoCaonhapXuatTon.byProduct.tongXuat');
    const colTonCuoi = t('baoCaonhapXuatTon.byProduct.tonCuoiKy');
    const rows = nxtResult.byProduct.map((r) => ({
      [colMaHang]: r.ma_hang,
      [colTenHang]: r.ten_hang,
      [colDanhMuc]: r.ten_danh_muc ?? '',
      [colDVT]: r.don_vi_tinh,
      [colTonDau]: r.ton_dau_ky,
      [colNhap]: r.tong_nhap,
      [colXuat]: r.tong_xuat,
      [colTonCuoi]: r.ton_cuoi_ky,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'NXT_TheoHang');
  }

  if (phieuList.length > 0) {
    const colSoPhieu = t('baoCaonhapXuatTon.chiTiet.soPhieu');
    const colNgay = t('baoCaonhapXuatTon.chiTiet.ngay');
    const colLoai = t('baoCaonhapXuatTon.chiTiet.loai');
    const colKho = t('baoCaonhapXuatTon.chiTiet.kho');
    const colKhoDen = t('baoCaonhapXuatTon.chiTiet.khoDen');
    const colTrangThai = t('baoCaonhapXuatTon.chiTiet.trangThai');
    const colMoTa = t('baoCaonhapXuatTon.chiTiet.moTa');
    const rows = phieuList.map((p) => ({
      [colSoPhieu]: p.so_phieu,
      [colNgay]: p.ngay,
      [colLoai]: p.loai,
      [colKho]: p.ten_kho ?? '',
      [colKhoDen]: p.ten_kho_den ?? '',
      [colTrangThai]: p.trang_thai,
      [colMoTa]: p.mo_ta ?? '',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'ChiTietPhieu');
  }

  if (tonRows.length > 0) {
    const colMaKho = t('baoCaonhapXuatTon.tonThoiDiem.maKho');
    const colTenKho = t('baoCaonhapXuatTon.tonThoiDiem.tenKho');
    const colMaHang = t('baoCaonhapXuatTon.tonThoiDiem.maHang');
    const colTenHang = t('baoCaonhapXuatTon.tonThoiDiem.tenHang');
    const colDanhMuc = t('baoCaonhapXuatTon.tonThoiDiem.danhMuc');
    const colDVT = t('baoCaonhapXuatTon.tonThoiDiem.donViTinh');
    const colSL = t('baoCaonhapXuatTon.tonThoiDiem.soLuong');
    const rows = tonRows.map((r) => ({
      [colMaKho]: r.ma_kho,
      [colTenKho]: r.ten_kho,
      [colMaHang]: r.ma_hang,
      [colTenHang]: r.ten_hang,
      [colDanhMuc]: r.ten_danh_muc ?? '',
      [colDVT]: r.don_vi_tinh,
      [colSL]: r.so_luong,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'TonTaiThoiDiem');
  }

  if (wb.SheetNames.length === 0) {
    const ws = XLSX.utils.aoa_to_sheet([[t('baoCaonhapXuatTon.empty')]]);
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
  }

  XLSX.writeFile(wb, `${FILENAME_PREFIX}_${filters.dateFrom}_${filters.dateTo}_${getTodayISODate()}.xlsx`);
}
