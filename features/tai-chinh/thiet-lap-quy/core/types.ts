import type { TrangThaiHoatDong } from '../../../../lib/constants';

/** Loại hạng mục: dùng cho phiếu thu, phiếu chi, hoặc cả hai. */
export type LoaiHangMuc = 'thu' | 'chi' | 'ca_hai';

/**
 * Hạng mục thu chi quỹ (fp_tc_hang_muc_thu_chi) — danh mục dùng chung toàn công ty,
 * module Thu chi quỹ chỉ đọc qua hook ref.
 */
export interface HangMucThuChi {
  id: string;
  ma: string;
  ten: string;
  loai: LoaiHangMuc;
  thu_tu: number;
  ghi_chu?: string;
  trang_thai: TrangThaiHoatDong;
  tg_tao: string;
  tg_cap_nhat: string;
}
