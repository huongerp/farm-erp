/**
 * Xuất báo cáo thống kê ứng viên (tab Thống kê).
 */
import type { UngVien } from '../core/types';
import { formatDateTimeShort } from '../../../../lib/utils';

export interface UngVienExportRow {
  ho_ten: string;
  email: string;
  so_dien_thoai: string;
  vi_tri: string;
  trang_thai: string;
  nguon: string;
  ngay_phong_van_gan_nhat: string;
  ket_qua_phan_hoi_gan_nhat: string;
  tg_tao: string;
}

export function ungVienToExportRow(item: UngVien): UngVienExportRow {
  const viTri = item.ma_de_xuat
    ? (item.ten_chuc_vu ? `${item.ma_de_xuat} · ${item.ten_chuc_vu}` : item.ma_de_xuat)
    : '';
  return {
    ho_ten: item.ho_ten ?? '',
    email: item.email ?? '',
    so_dien_thoai: item.so_dien_thoai ?? '',
    vi_tri: viTri,
    trang_thai: item.ten_trang_thai ?? '',
    nguon: item.ten_kenh_tuyen_dung ?? '',
    ngay_phong_van_gan_nhat: item.ngay_phong_van_gan_nhat
      ? formatDateTimeShort(item.ngay_phong_van_gan_nhat)
      : '',
    ket_qua_phan_hoi_gan_nhat: item.ket_qua_phan_hoi_gan_nhat ?? '',
    tg_tao: formatDateTimeShort(item.tg_tao),
  };
}

export const UNG_VIEN_EXPORT_FILENAME = 'thong_ke_ung_vien';
