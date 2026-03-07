import type { ThuChi } from '../../core/types';
import { formatDate, getTodayISODate } from '../../../../lib/utils';
import type { TFunction } from 'i18next';

const FILENAME_PREFIX = 'thu_chi';

export async function exportThuChiToExcel(list: ThuChi[], t: TFunction): Promise<void> {
  const XLSX = await import('xlsx');
  const rows = list.map((g) => ({
    [t('thuChi.columns.maGiaoDich')]: g.ma_giao_dich,
    [t('thuChi.columns.ngayGiaoDich')]: formatDate(g.ngay_giao_dich),
    [t('thuChi.columns.loai')]: g.loai === 'thu' ? t('thuChi.loaiThu') : g.loai === 'chi' ? t('thuChi.loaiChi') : t('thuChi.loaiChuyenQuy'),
    [t('thuChi.columns.taiKhoan')]: g.ten_tai_khoan ?? '',
    [t('thuChi.columns.taiKhoanDich')]: g.ten_tai_khoan_dich ?? '',
    [t('thuChi.columns.danhMuc')]: g.ten_danh_muc ?? '',
    [t('thuChi.columns.soTien')]: g.so_tien,
    [t('thuChi.columns.noiDung')]: g.noi_dung ?? '',
    [t('thuChi.columns.nguoiThucHien')]: g.ten_nhan_vien ?? '',
    [t('thuChi.columns.trangThai')]: g.trang_thai === 'hoan_thanh' ? t('thuChi.status.hoanThanh') : g.trang_thai === 'cho_duyet' ? t('thuChi.status.choDuyet') : t('thuChi.status.huy'),
    [t('thuChi.columns.phiGiaoDich')]: g.phi_giao_dich ?? '',
    [t('thuChi.columns.lienKetDeXuat')]: g.so_phieu_de_xuat ?? g.id_de_xuat_chi_phi ?? '',
  }));
  const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{ [t('thuChi.empty')]: '' }]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'ThuChi');
  XLSX.writeFile(wb, `${FILENAME_PREFIX}_${getTodayISODate()}.xlsx`);
}
