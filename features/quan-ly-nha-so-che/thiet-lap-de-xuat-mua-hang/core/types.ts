import type { TrangThaiHoatDong } from '../../../../lib/constants';

/** Tiến độ mua hàng của farm — danh mục riêng (fp_farm_tien_do_mua_hang), dùng bởi module Đề xuất mua hàng. */
export interface FarmTienDoMuaHang {
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
