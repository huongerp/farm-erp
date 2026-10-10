/** Xuất danh sách đăng ký nhận hàng: map phẳng + định nghĩa cột (cùng khuôn thu-hoach). */
import type { TFunction } from 'i18next';
import type { ExportColumn } from '../../../../components/shared/LazyExportDialog';
import { formatDateTimeShort, formatYmdToDisplay } from '../../../../lib/utils';
import type { DangKyNhanHang } from '../core/types';
import { soPhutRaQuaGio, soPhutTrongFarm, soPhutVaoTre } from '../core/thoi-gian';
import i18n from '../../../../lib/i18n';

export function mapDangKyNhanHangRow(p: DangKyNhanHang): Record<string, unknown> {
  return {
    id: p.id,
    ngay_dang_ky: formatYmdToDisplay(p.ngay_dang_ky),
    trang_thai: i18n.t(`dangKyNhanHang.trangThai.${p.trang_thai}`),
    ten_chi_nhanh: p.ten_chi_nhanh ?? '',
    khach_hang: p.khach_hang ?? '',
    loai_hang_hoa: p.loai_hang_hoa ?? '',
    so_luong_dang_ky: p.so_luong_dang_ky ?? '',
    so_xe: p.so_xe ?? '',
    so_cont: p.so_cont ?? '',
    ten_tai_xe: p.ten_tai_xe ?? '',
    sdt_tai_xe: p.sdt_tai_xe ?? '',
    gio_dang_ky_tu: p.gio_dang_ky_tu ?? '',
    gio_dang_ky_den: p.gio_dang_ky_den ?? '',
    tg_vao_thuc_te: p.tg_vao_thuc_te ? formatDateTimeShort(p.tg_vao_thuc_te) : '',
    tg_ra_thuc_te: p.tg_ra_thuc_te ? formatDateTimeShort(p.tg_ra_thuc_te) : '',
    phut_trong_farm: soPhutTrongFarm(p.tg_vao_thuc_te, p.tg_ra_thuc_te) ?? '',
    phut_vao_tre: soPhutVaoTre(p.ngay_dang_ky, p.gio_dang_ky_tu, p.tg_vao_thuc_te) ?? '',
    phut_ra_qua_gio: soPhutRaQuaGio(p.ngay_dang_ky, p.gio_dang_ky_tu, p.gio_dang_ky_den, p.tg_ra_thuc_te) ?? '',
    tong_so_luong: p.tong_so_luong,
    so_anh: p.hinh_anh_urls.length,
    ten_nguoi_check_in: p.ten_nguoi_check_in ?? '',
    ten_nguoi_check_out: p.ten_nguoi_check_out ?? '',
    ghi_chu: p.ghi_chu ?? '',
    ten_nguoi_tao: p.ten_nguoi_tao ?? '',
  };
}

const EXPORT_KEYS = [
  'id',
  'ngay_dang_ky',
  'trang_thai',
  'ten_chi_nhanh',
  'khach_hang',
  'loai_hang_hoa',
  'so_luong_dang_ky',
  'so_xe',
  'so_cont',
  'ten_tai_xe',
  'sdt_tai_xe',
  'gio_dang_ky_tu',
  'gio_dang_ky_den',
  'tg_vao_thuc_te',
  'tg_ra_thuc_te',
  'phut_trong_farm',
  'phut_vao_tre',
  'phut_ra_qua_gio',
  'tong_so_luong',
  'so_anh',
  'ten_nguoi_check_in',
  'ten_nguoi_check_out',
  'ghi_chu',
  'ten_nguoi_tao',
] as const;

export function getExportColumnsDangKyNhanHang(t: TFunction): ExportColumn[] {
  return EXPORT_KEYS.map((key) => ({ key, label: t(`dangKyNhanHang.export.${key}`) }));
}

export const exportFileNameDangKyNhanHang = () =>
  `dang-ky-nhan-hang-${new Date().toISOString().slice(0, 10)}`;
