/** Cấu hình đề xuất vật tư (dùng bởi module Phiếu đề xuất vật tư) */
export interface CauHinhDeXuatVatTu {
  thoi_han_duyet_ngay: number;
  bat_canh_bao_qua_han: boolean;
  tien_to_so_phieu: string;
  tu_sinh_so_phieu: boolean;
  do_dai_phan_so: number;
  so_thu_tu_tiep_theo: number;
  ngay_can_bat_buoc: boolean;
  ghi_chu_bat_buoc: boolean;
  so_dong_toi_da: number;
  so_ngay_mac_dinh_ngay_can: number;
  trang_thai_mac_dinh: 0 | 1;
  cho_phep_sua_sau_duyet: boolean;
}

import type { TrangThaiHoatDong } from '../../../../lib/constants';

/** Trạng thái đối tác (dùng trong module Danh sách đối tác / Nhà cung cấp) */
export interface TrangThaiDoiTac {
  id: string;
  ma: string;
  ten: string;
  thu_tu: number;
  mau?: string;
  ghi_chu?: string;
  trang_thai: TrangThaiHoatDong;
  tg_tao: string;
  tg_cap_nhat: string;
}

/** Trạng thái thanh toán đối tác (dùng trong module Thanh toán đối tác) */
export interface TrangThaiThanhToanDoiTac {
  id: string;
  ma: string;
  ten: string;
  thu_tu: number;
  mau?: string;
  ghi_chu?: string;
  trang_thai: TrangThaiHoatDong;
  tg_tao: string;
  tg_cap_nhat: string;
}
