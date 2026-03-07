import type { ThuChiStatsByLoai, ThuChiStatsByTaiKhoan, ThuChiStatsByDanhMuc } from '../services/thu-chi-service';
import { getTodayISODate } from '../../../../lib/utils';
import type { TFunction } from 'i18next';

const FILENAME_PREFIX = 'thong_ke_thu_chi';

export async function exportThuChiStatsToExcel(
  tuNgay: string,
  denNgay: string,
  byLoai: ThuChiStatsByLoai[],
  byTaiKhoan: ThuChiStatsByTaiKhoan[],
  byDanhMuc: ThuChiStatsByDanhMuc[],
  t: TFunction
): Promise<void> {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();

  const loaiLabel = (loai: string) =>
    loai === 'thu' ? t('thuChi.loaiThu') : loai === 'chi' ? t('thuChi.loaiChi') : t('thuChi.loaiChuyenQuy');

  const rowsLoai = byLoai.map((r) => ({
    [t('thuChi.columns.loai')]: loaiLabel(r.loai),
    [t('thuChi.stats.soGiaoDich')]: r.so_giao_dich,
    [t('thuChi.columns.soTien')]: r.tong_tien,
  }));
  if (rowsLoai.length > 0) {
    const ws1 = XLSX.utils.json_to_sheet(rowsLoai);
    XLSX.utils.book_append_sheet(wb, ws1, 'TheoLoai');
  }

  const rowsTk = byTaiKhoan.map((r) => ({
    [t('thuChi.columns.taiKhoan')]: r.ten_tai_khoan,
    [t('thuChi.stats.tongThu')]: r.tong_thu,
    [t('thuChi.stats.tongChi')]: r.tong_chi,
    [t('thuChi.stats.soGiaoDich')]: r.so_giao_dich,
  }));
  if (rowsTk.length > 0) {
    const ws2 = XLSX.utils.json_to_sheet(rowsTk);
    XLSX.utils.book_append_sheet(wb, ws2, 'TheoTaiKhoan');
  }

  const rowsDm = byDanhMuc.map((r) => ({
    [t('thuChi.columns.danhMuc')]: r.ten_danh_muc,
    [t('thuChi.columns.loai')]: loaiLabel(r.loai),
    [t('thuChi.stats.soGiaoDich')]: r.so_giao_dich,
    [t('thuChi.columns.soTien')]: r.tong_tien,
  }));
  if (rowsDm.length > 0) {
    const ws3 = XLSX.utils.json_to_sheet(rowsDm);
    XLSX.utils.book_append_sheet(wb, ws3, 'TheoDanhMuc');
  }

  if (wb.SheetNames.length === 0) {
    const ws = XLSX.utils.aoa_to_sheet([[t('thuChi.empty')]]);
    XLSX.utils.book_append_sheet(wb, ws, 'Stats');
  }

  XLSX.writeFile(wb, `${FILENAME_PREFIX}_${tuNgay}_${denNgay}_${getTodayISODate()}.xlsx`);
}
